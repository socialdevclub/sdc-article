import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ArticleCard } from "./ArticleCard";
import { ArticleFilters, CATEGORIES, SortOption } from "./ArticleFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

type Article = Tables<"articles">;

export const ArticleList = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("articles").select("*");

      // Category filter
      if (selectedCategory !== "전체") {
        query = query.eq("category", selectedCategory);
      }

      // Liked only filter
      if (showLikedOnly) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          setError("좋아요한 글을 보려면 로그인이 필요합니다.");
          setLoading(false);
          return;
        }
        
        // Get articles that the user liked
        const { data: likedArticles } = await supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", user.data.user.id);
        
        if (!likedArticles || likedArticles.length === 0) {
          setArticles([]);
          setLoading(false);
          return;
        }
        
        const likedArticleIds = likedArticles.map(like => like.article_id);
        query = query.in("id", likedArticleIds);
      }

      // Sort options
      switch (sortOption) {
        case "latest":
          query = query.order("published_at", { ascending: false });
          break;
        case "daily":
        case "weekly":
        case "monthly":
          // For popularity sorting, we'll get all articles and then sort by likes count
          const { data: articlesData, error: articlesError } = await query;
          if (articlesError) throw articlesError;
          
          if (articlesData) {
            // Get likes count for each article with time filter
            const now = new Date();
            let timeFilter: Date;
            
            switch (sortOption) {
              case "daily":
                timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
              case "weekly":
                timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
              case "monthly":
                timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            }
            
            const articlesWithLikes = await Promise.all(
              articlesData.map(async (article) => {
                const { count } = await supabase
                  .from("likes")
                  .select("*", { count: "exact", head: true })
                  .eq("article_id", article.id)
                  .gte("created_at", timeFilter!.toISOString());
                
                return { ...article, likesCount: count || 0 };
              })
            );
            
            // Sort by likes count descending
            articlesWithLikes.sort((a, b) => b.likesCount - a.likesCount);
            setArticles(articlesWithLikes.slice(0, 50));
          }
          setLoading(false);
          return;
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("아티클을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, sortOption, showLikedOnly]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ArticleFilters
          selectedCategory={selectedCategory}
          sortOption={sortOption}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortOption}
          totalCount={0}
          showLikedOnly={showLikedOnly}
          onLikedOnlyChange={setShowLikedOnly}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ArticleFilters
        selectedCategory={selectedCategory}
        sortOption={sortOption}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSortOption}
        totalCount={articles.length}
        showLikedOnly={showLikedOnly}
        onLikedOnlyChange={setShowLikedOnly}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-lg mb-2">아티클이 없습니다</div>
            <div className="text-sm text-muted-foreground">다른 카테고리를 선택해보세요</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};