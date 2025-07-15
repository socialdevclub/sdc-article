import { useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { LoginDialog } from "./LoginDialog";
import { ArticleLikes } from "./ArticleLikes";
import { gtagEvent, htmlToPlainText } from "@/lib/utils";
import { useImpressionRef } from "react-simplikit";
import { getSourceFromUrl } from "@/lib/getSourceFromUrl";

type Article = Tables<"articles">;

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = memo(({ article }: ArticleCardProps) => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [shouldFetchLikes, setShouldFetchLikes] = useState(false);
  
  // Impression tracking으로 화면에 보일 때만 데이터 페칭 시작
  const impressionRef = useImpressionRef({
    onImpressionStart: () => {
      setShouldFetchLikes(true);
    },
    rootMargin: '100px',
    areaThreshold: 0.1,
  });

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

  const handleShowLogin = useCallback(() => {
    setShowLoginDialog(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setShowLoginDialog(false);
  }, []);

  return (
    <>
      <Card 
        ref={impressionRef}
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

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {/* Likes - 화면에 보일 때만 데이터 페칭 */}
                <ArticleLikes 
                  articleId={article.id} 
                  onShowLogin={handleShowLogin}
                  enabled={shouldFetchLikes}
                />
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