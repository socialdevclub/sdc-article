import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LoginDialog } from "./LoginDialog";
import { gtagEvent, htmlToPlainText } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useArticleLikes } from "@/hooks/useArticleLikes";

type Article = Tables<"articles">;

interface ArticleCardProps {
  article: Article;
}

type ArticleSource = {
  name: string;
  favicon?: string;
  fallbackThumbnail?: string;
}

export const SOURCE_MAP: Record<string, ArticleSource> = {
  "toss.tech": {
    name: "토스",
    favicon: "https://static.toss.im/tds/favicon/favicon-16x16.png"
  },
  "tech.kakaopay.com": {
    name: "카카오페이",
    favicon: "https://tech.kakaopay.com/favicon.ico"
  },
  "engineering.ab180.co": {
    name: "AB180",
    favicon: "https://oopy.lazyrockets.com/api/rest/cdn/image/7bbc75b5-1cdf-4b59-aec4-af3e335b3aad.png?d=16"
  },
  "thefarmersfront.github.io": {
    name: "컬리",
    favicon: "https://www.kurly.com/favicon.ico"
  },
  "tech.devsisters.com": {
    name: "데브시스터스",
    favicon: "https://tech.devsisters.com/favicon-32x32.png"
  },
  "tech.socarcorp.kr": {
    name: "쏘카",
    favicon: "https://tech.socarcorp.kr/assets/icon/favicon.ico"
  },
  "hyperconnect.github.io": {
    name: "하이퍼커넥트",
    favicon: "https://hyperconnect.github.io/assets/favicon.svg"
  },
  "tech.kakao.com": {
    name: "카카오",
    favicon: "https://tech.kakao.com/favicon.ico"
  },
  "d2.naver.com": {
    name: "네이버 D2",
    favicon: "https://d2.naver.com/favicon.ico",
    fallbackThumbnail: "https://d2.naver.com/static/img/app/d2_logo_renewal.png"
  },
  "techblog.lycorp.co.jp": {
    name: "라인",
    favicon: "https://techblog.lycorp.co.jp/favicon.ico"
  },
  "tech.inflab.com": {
    name: "인프랩",
    favicon: "https://tech.inflab.com/favicon-32x32.png"
  },
  "blog.banksalad.com": {
    name: "뱅크샐러드",
    favicon: "https://blog.banksalad.com/favicon-32x32.png"
  },
  "danawalab.github.io": {
    name: "다나와",
    favicon: "https://img.danawa.com/new/danawa_main/v1/img/danawa_favicon.ico"
  },
  "medium.com/musinsa-tech": {
    name: "무신사",
    favicon: "https://miro.medium.com/v2/1*Qs-0adxK8doDYyzZXMXkmg.png"
  },
  "medium.com/miridih": {
    name: "미리디",
    favicon: "https://miro.medium.com/v2/1*uNdurJkcAe2-UoseF_dxrQ.png"
  },
  "medium.com/daangn": {
    name: "당근",
    favicon: "https://miro.medium.com/v2/resize:fill:76:76/1*Bm8_nGjfNiKV0PASwiPELg.png"
  }
}

export const getSourceFromUrl = (url: string): ArticleSource => {
  try {
    const hostname = new URL(url).hostname;
    const subDomainName = hostname.split(".")[0];
    const author = url.split("/")[3];
    
    if (SOURCE_MAP[hostname]) {
      return SOURCE_MAP[hostname];
    } else if (SOURCE_MAP[`${hostname}/${author}`]) {
      return SOURCE_MAP[`${hostname}/${author}`];
    }
    
    switch (true) {
      case hostname.includes("tistory.com"): {
        return {
          name: `tistory.com > ${subDomainName}`
        }
      }
      case hostname.includes("github.io"): {
        return {
          name: `github.io > ${subDomainName}`
        }
      }
      case hostname.includes("medium.com"): {
        return {
          name: `medium.com > ${author}`
        }
      }
      case hostname.includes("dev.to"): {
        return {
          name: `dev.to > ${author}`
        }
      }
      case hostname.includes("velog.io"): {
        return {
          name: `velog.io > ${author}`
        }
      }
      default: {
        return {
          name: hostname
        }
      }
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
    return {
      name: url
    }
  }
}

export const ArticleCard = memo(({ article }: ArticleCardProps) => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const { likesCount, isLiked, toggleLike, isToggling } = useArticleLikes(article.id);

  const source = useMemo(() => getSourceFromUrl(article.source_url), [article.source_url]);
  const sourceName = source?.name;
  const sourceFavicon = source?.favicon;
  const sourceFallbackThumbnail = source?.fallbackThumbnail;

  const thumbnailUrl = article.thumbnail_url || sourceFallbackThumbnail || sourceFavicon;

  const handleClick = useCallback(() => {
    gtagEvent('click_article', {
      event_category: article.category,
      event_title: article.title,
      event_url: article.source_url,
      event_source_name: sourceName,
    })
    window.open(article.source_url, '_blank');
  }, [article.category, article.title, article.source_url, sourceName]);

  const formattedDate = useMemo(() => {
    const dateString = article.published_at || article.created_at;
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [article.published_at, article.created_at]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    toggleLike();
  }, [isAuthenticated, toggleLike]);

  const handleLoginSuccess = useCallback(() => {
    // 로그인 성공 시 좋아요 데이터는 자동으로 refetch됩니다
    setShowLoginDialog(false);
  }, []);

  return (
    <>
      <Card 
        className="group bg-gradient-card border-border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 w-full"
      >
        <CardContent className="p-0" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Thumbnail */}
          {article.thumbnail_url ? (
            <div className="aspect-video overflow-hidden rounded-t-lg cursor-pointer" onClick={handleClick}>
              <img
                src={article.thumbnail_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="aspect-video overflow-hidden rounded-t-lg cursor-pointer" onClick={handleClick}>
              <img src={sourceFallbackThumbnail || sourceFavicon} alt={sourceName} className="w-full h-full object-none group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          
          <div className="p-6 space-y-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between', flex: 1 }}>
              <div>
                {/* Category */}
                <Badge 
                  variant="secondary" 
                  className="bg-[hsl(var(--category-bg))] text-[hsl(var(--category-text))] hover:bg-[hsl(var(--category-bg))]"
                >
                  {article.category}
                </Badge>

                {/* Title */}
                <h3 className="text-lg font-semibold line-clamp-2 transition-colors cursor-pointer" onClick={handleClick}>
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed cursor-pointer" onClick={handleClick}>
                  {htmlToPlainText(article.content_summary)}
                </p>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {/* ArticleSource & Actions */}
              <div className="flex items-center gap-2">
                {sourceFavicon && <img src={sourceFavicon} alt={sourceName} className="w-4 h-4" />}
                <span className="text-xs text-muted-foreground">{sourceName || article.source_url}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={handleLike}>
                {/* Likes */}
                <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
                  <span>{likesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
});