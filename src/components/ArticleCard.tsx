import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Heart } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "./LoginDialog";
import { gtagEvent } from "@/lib/utils";

type Article = Tables<"articles">;

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleClick = () => {
    gtagEvent('click', {
      category: 'article',
      title: article.title,
      url: article.source_url,
      source_name: article.source_name,
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

  // useEffect(() => {
  //   fetchLikesData();
  // }, [article.id]);

  // const fetchLikesData = async () => {
  //   // Get likes count
  //   const { count } = await supabase
  //     .from("likes")
  //     .select("*", { count: "exact", head: true })
  //     .eq("article_id", article.id);
    
  //   setLikesCount(count || 0);

  //   // Check if current user liked this article
  //   const user = await supabase.auth.getUser();
  //   if (user.data.user) {
  //     const { data } = await supabase
  //       .from("likes")
  //       .select("id")
  //       .eq("article_id", article.id)
  //       .eq("user_id", user.data.user.id)
  //       .single();
      
  //     setIsLiked(!!data);
  //   }
  // };

  // const handleLike = async (e: React.MouseEvent) => {
  //   e.stopPropagation();
    
  //   const user = await supabase.auth.getUser();
  //   if (!user.data.user) {
  //     setShowLoginDialog(true);
  //     return;
  //   }

  //   setIsLoading(true);
    
  //   try {
  //     if (isLiked) {
  //       // Unlike
  //       await supabase
  //         .from("likes")
  //         .delete()
  //         .eq("article_id", article.id)
  //         .eq("user_id", user.data.user.id);
        
  //       setIsLiked(false);
  //       setLikesCount(prev => prev - 1);
  //     } else {
  //       // Like
  //       await supabase
  //         .from("likes")
  //         .insert({
  //           article_id: article.id,
  //           user_id: user.data.user.id
  //         });
        
  //       setIsLiked(true);
  //       setLikesCount(prev => prev + 1);
  //     }
  //   } catch (error) {
  //     console.error("Error toggling like:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleLoginSuccess = () => {
  //   fetchLikesData();
  // };

  return (
    <>
      <Card 
        className="group cursor-pointer bg-gradient-card border-border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 w-full"
        onClick={handleClick}
      >
        <CardContent className="p-0" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          
          <div className="p-6 space-y-4" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {/* Date */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.published_at)}</span>
                </div>
                
                {/* Likes */}
                {/* <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                  <span>{likesCount}</span>
                </div> */}
              </div>

              {/* Source & Actions */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{article.source_name}</span>
                <div className="flex items-center gap-1">
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={isLoading}
                    className="h-6 w-6 p-0"
                  >
                    <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
                  </Button> */}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        // onSuccess={handleLoginSuccess}
      />
    </>
  );
};