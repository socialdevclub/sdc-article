import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ExternalLink, Eye } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const handleClick = () => {
    window.open(article.source_url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card 
      className="group cursor-pointer bg-gradient-card border-border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        {article.thumbnail_url && (
          <div className="aspect-video overflow-hidden rounded-t-lg">
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="p-6 space-y-4">
          {/* Category */}
          <Badge 
            variant="secondary" 
            className="bg-[hsl(var(--category-bg))] text-[hsl(var(--category-text))] hover:bg-[hsl(var(--category-bg))]"
          >
            {article.category}
          </Badge>

          {/* Title */}
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
            {article.content_summary}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(article.published_at)}</span>
              </div>
              
              {/* Views */}
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatViewCount(article.view_count)}</span>
              </div>
            </div>

            {/* Source & External Link */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{article.source_name}</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};