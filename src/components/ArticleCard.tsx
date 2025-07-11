import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Heart } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "./LoginDialog";
import { gtagEvent, htmlToPlainText } from "@/lib/utils";

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
  }
}

export const getSourceFromUrl = (url: string): ArticleSource => {
  const hostname = new URL(url).hostname;
  const subDomainName = hostname.split(".")[0];
  if (SOURCE_MAP[hostname]) {
    return SOURCE_MAP[hostname];
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
  }
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const source = getSourceFromUrl(article.source_url)
  const sourceName = source?.name;
  const sourceFavicon = source?.favicon;
  const sourceFallbackThumbnail = source?.fallbackThumbnail;

  const handleClick = () => {
    gtagEvent('click_article', {
      event_category: article.category,
      event_title: article.title,
      event_url: article.source_url,
      event_source_name: sourceName,
    })
    window.open(article.source_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchLikesData = useCallback(async () => {
    // Get likes count
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("article_id", article.id);
    
    setLikesCount(count || 0);

    // Check if current user liked this article
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("article_id", article.id)
        .eq("user_id", user.data.user.id)
        .single();
      
      setIsLiked(!!data);
    }
  }, [article.id]);

  useEffect(() => {
    fetchLikesData();
  }, [fetchLikesData]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      setShowLoginDialog(true);
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("article_id", article.id)
          .eq("user_id", user.data.user.id);
        
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from("likes")
          .insert({
            article_id: article.id,
            user_id: user.data.user.id
          });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    fetchLikesData();
  };

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
              <img src={sourceFallbackThumbnail} alt={sourceName} className="w-full h-full object-none group-hover:scale-105 transition-transform duration-300" />
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
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {/* ArticleSource & Actions */}
              <div className="flex items-center gap-2">
                {sourceFavicon && <img src={sourceFavicon} alt={sourceName} className="w-4 h-4" />}
                <span className="text-xs text-muted-foreground">{sourceName || article.source_url}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground cursor-pointer" onClick={handleLike}>
                {/* Likes */}
                <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
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
};