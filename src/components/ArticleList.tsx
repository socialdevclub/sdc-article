import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ArticleCard } from "./ArticleCard";
import { ArticleFilters, CATEGORIES, SortOption } from "./ArticleFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Loader2 } from "lucide-react";
import { useIntersectionObserver } from "react-simplikit";
import { SOURCE_MAP } from "@/lib/getSourceFromUrl";

type Article = Tables<"articles">;

const ARTICLES_PER_PAGE = 20;

// 검색어 파싱 함수: 일반 검색어와 소스 도메인을 분리
const parseSearchQuery = (query: string) => {
  // (domain) 형태로 감싸진 경우
  const sourceMatch = query.match(/\((.*?)\)$/);
  if (sourceMatch) {
    const normalSearchTerm = query.replace(/\s*\(.*?\)$/, '').trim();
    const sourceDomain = sourceMatch[1].trim();
    return { normalSearchTerm, sourceDomain };
  }
  
  // SOURCE_MAP에 있는 도메인인지 확인 (회사만 선택한 경우)
  if (Object.keys(SOURCE_MAP).includes(query.trim())) {
    return { normalSearchTerm: '', sourceDomain: query.trim() };
  }
  
  return { normalSearchTerm: query, sourceDomain: '' };
};

export const ArticleList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // URL에서 카테고리 파라미터 읽어오기
  const getCategoriesFromURL = useCallback((): string[] => {
    const categoriesParam = searchParams.get('categories');
    if (!categoriesParam) return ["전체"];
    
    const categories = categoriesParam.split(',').filter(cat => CATEGORIES.includes(cat));
    return categories.length > 0 ? categories : ["전체"];
  }, [searchParams]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => getCategoriesFromURL());
  const [sortOption, setSortOption] = useState<SortOption>("latest");
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // react-simplikit의 useIntersectionObserver 사용
  const intersectionRef = useIntersectionObserver(
    (entry: IntersectionObserverEntry) => {
      setIsIntersecting(entry.isIntersecting);
    },
    {
      threshold: 0.1,
      rootMargin: "100px"
    }
  );

  // 카테고리 변경 시 URL도 함께 업데이트
  const handleCategoryChange = useCallback((newCategories: string[]) => {
    setSelectedCategories(newCategories);
    
    // URL 쿼리스트링 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    if (newCategories.includes("전체") || newCategories.length === 0) {
      newSearchParams.delete('categories');
    } else {
      newSearchParams.set('categories', newCategories.join(','));
    }
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

  // URL 변경 감지하여 상태 동기화
  useEffect(() => {
    const categoriesFromURL = getCategoriesFromURL();
    setSelectedCategories(categoriesFromURL);
  }, [getCategoriesFromURL]);

  const handleLikedOnlyChange = async (checked: boolean) => {
    if (checked) {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        // 로그인이 필요한 경우 ArticleFilters에서 처리하도록 함
        return;
      }
    }
    setShowLikedOnly(checked);
  };

  const resetArticles = useCallback(() => {
    setArticles([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, []);

  // 인기순 아티클 fetch (기존 로직 유지)
  const fetchPopularArticles = useCallback(async (currentOffset: number, isLoadMore: boolean) => {
    try {
      // 시간 범위 계산
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
        case "popular:all":
          timeFilter = new Date(0);
          break;
        default:
          timeFilter = new Date(0);
      }

      // 아티클과 해당 기간의 좋아요 수를 함께 조회
      let baseQuery = supabase
        .from("articles")
        .select(`
          *,
          likes!inner(created_at)
        `)
        .gte("likes.created_at", timeFilter.toISOString());

      // 카테고리 필터 (검색어가 없을 때만 서버 필터 적용)
      if (!selectedCategories.includes("전체") && selectedCategories.length > 0 && !searchQuery.trim()) {
        baseQuery = baseQuery.in("category", selectedCategories);
      }

      // 좋아요한 글만 보기 필터
      if (showLikedOnly) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          setError("좋아요한 글을 보려면 로그인이 필요합니다.");
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        
        const { data: likedArticles } = await supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", user.data.user.id);
        
        if (!likedArticles || likedArticles.length === 0) {
          if (!isLoadMore) {
            setArticles([]);
          }
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        
        const likedArticleIds = likedArticles.map(like => like.article_id);
        baseQuery = baseQuery.in("id", likedArticleIds);
      }

      // 검색 필터 적용
      if (searchQuery.trim()) {
        const { normalSearchTerm, sourceDomain } = parseSearchQuery(searchQuery.trim());
        
        if (sourceDomain && normalSearchTerm) {
          // 일반 검색어와 소스 도메인 모두 있는 경우 - AND 조건
          baseQuery = baseQuery
            .or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%`)
            .ilike('source_url', `%${sourceDomain}%`);
        } else if (sourceDomain) {
          // 소스 도메인만 있는 경우
          baseQuery = baseQuery.ilike('source_url', `%${sourceDomain}%`);
        } else if (normalSearchTerm) {
          // 일반 검색어만 있는 경우 (source_url도 포함)
          baseQuery = baseQuery.or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%,source_url.ilike.%${normalSearchTerm}%`);
        }
      }

      // 모든 아티클과 해당 좋아요 수를 가져와서 클라이언트에서 정렬
      const { data: articlesWithLikes, error } = await baseQuery;
      
      if (error) throw error;

      if (!articlesWithLikes) {
        if (!isLoadMore) {
          setArticles([]);
        }
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // 아티클별 좋아요 수 계산 및 중복 제거
      const articleLikeCounts = new Map<string, { article: Article; likesCount: number }>();
      
      articlesWithLikes.forEach((item: Article & { likes: unknown }) => {
        const articleId = item.id;
        if (articleLikeCounts.has(articleId)) {
          articleLikeCounts.get(articleId)!.likesCount++;
        } else {
          // likes 속성 제거하고 아티클만 저장
          const { likes, ...article } = item;
          articleLikeCounts.set(articleId, { article, likesCount: 1 });
        }
      });

      // 좋아요 수가 없는 아티클들도 포함 (해당 기간에 좋아요가 없는 경우)
      let allArticlesQuery = supabase.from("articles").select("*").order("published_at", { ascending: false });
      
      if (!selectedCategories.includes("전체") && selectedCategories.length > 0 && !searchQuery.trim()) {
        allArticlesQuery = allArticlesQuery.in("category", selectedCategories);
      }

      if (showLikedOnly) {
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          const { data: likedArticles } = await supabase
            .from("likes")
            .select("article_id")
            .eq("user_id", user.data.user.id);
          
          if (likedArticles && likedArticles.length > 0) {
            const likedArticleIds = likedArticles.map(like => like.article_id);
            allArticlesQuery = allArticlesQuery.in("id", likedArticleIds);
          }
        }
      }

      if (searchQuery.trim()) {
        const { normalSearchTerm, sourceDomain } = parseSearchQuery(searchQuery.trim());
        
        if (sourceDomain && normalSearchTerm) {
          // 일반 검색어와 소스 도메인 모두 있는 경우 - AND 조건
          allArticlesQuery = allArticlesQuery
            .or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%`)
            .ilike('source_url', `%${sourceDomain}%`);
        } else if (sourceDomain) {
          // 소스 도메인만 있는 경우
          allArticlesQuery = allArticlesQuery.ilike('source_url', `%${sourceDomain}%`);
        } else if (normalSearchTerm) {
          // 일반 검색어만 있는 경우 (source_url도 포함)
          allArticlesQuery = allArticlesQuery.or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%,source_url.ilike.%${normalSearchTerm}%`);
        }
      }

      const { data: allArticles } = await allArticlesQuery;
      
      if (allArticles) {
        allArticles.forEach(article => {
          if (!articleLikeCounts.has(article.id)) {
            articleLikeCounts.set(article.id, { article, likesCount: 0 });
          }
        });
      }

      // 좋아요 수로 정렬
      let sortedArticles = Array.from(articleLikeCounts.values())
        .sort((a, b) => b.likesCount - a.likesCount)
        .map(item => item.article);

      // 카테고리 필터링 (검색어가 있을 때만 클라이언트 사이드)
      if (searchQuery.trim() && !selectedCategories.includes("전체") && selectedCategories.length > 0) {
        sortedArticles = sortedArticles.filter(article => 
          selectedCategories.includes(article.category)
        );
      }

      // 페이지네이션 적용
      const startIndex = currentOffset;
      const endIndex = currentOffset + ARTICLES_PER_PAGE;
      const paginatedArticles = sortedArticles.slice(startIndex, endIndex);

      if (isLoadMore) {
        setArticles(prev => [...prev, ...paginatedArticles]);
      } else {
        setArticles(paginatedArticles);
      }

      // 더 이상 데이터가 없는지 확인
      setHasMore(paginatedArticles.length === ARTICLES_PER_PAGE && endIndex < sortedArticles.length);
      
      if (isLoadMore) {
        setOffset(currentOffset + ARTICLES_PER_PAGE);
      }

    } catch (err) {
      console.error("Error fetching popular articles:", err);
      setError("인기 아티클을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategories, showLikedOnly, sortOption, searchQuery]);

  // 통합된 아티클 fetch 함수 (페이지네이션과 검색 지원)
  const fetchArticles = useCallback(async (currentOffset: number = 0, isLoadMore: boolean = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // 인기순 정렬 처리 (기존 로직 유지)
      if (sortOption === "daily" || sortOption === "weekly" || sortOption === "monthly" || sortOption === "popular:all") {
        await fetchPopularArticles(currentOffset, isLoadMore);
        return;
      }

      // 기본 쿼리 설정
      let query = supabase.from("articles").select("*");

      // 좋아요한 글만 보기 필터
      if (showLikedOnly) {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
          setError("좋아요한 글을 보려면 로그인이 필요합니다.");
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        
        const { data: likedArticles } = await supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", user.data.user.id);
        
        if (!likedArticles || likedArticles.length === 0) {
          if (!isLoadMore) {
            setArticles([]);
          }
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        
        const likedArticleIds = likedArticles.map(like => like.article_id);
        query = query.in("id", likedArticleIds);
      }

      // 카테고리 필터 (서버 사이드)
      if (!selectedCategories.includes("전체") && selectedCategories.length > 0) {
        query = query.in("category", selectedCategories);
      }

      // 검색 필터 (서버 사이드)
      if (searchQuery.trim()) {
        const { normalSearchTerm, sourceDomain } = parseSearchQuery(searchQuery.trim());
        
        if (sourceDomain && normalSearchTerm) {
          // 일반 검색어와 소스 도메인 모두 있는 경우 - AND 조건
          query = query
            .or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%`)
            .ilike('source_url', `%${sourceDomain}%`);
        } else if (sourceDomain) {
          // 소스 도메인만 있는 경우
          query = query.ilike('source_url', `%${sourceDomain}%`);
        } else if (normalSearchTerm) {
          // 일반 검색어만 있는 경우 (source_url도 포함)
          query = query.or(`title.ilike.%${normalSearchTerm}%,content_summary.ilike.%${normalSearchTerm}%,category.ilike.%${normalSearchTerm}%,source_url.ilike.%${normalSearchTerm}%`);
        }
      }

      // 정렬 (최신순)
      query = query.order("published_at", { ascending: false });

      // 페이지네이션
      query = query.range(currentOffset, currentOffset + ARTICLES_PER_PAGE - 1);

      const { data, error } = await query;
      if (error) throw error;

      const fetchedArticles = data || [];

      if (isLoadMore) {
        setArticles(prev => [...prev, ...fetchedArticles]);
      } else {
        setArticles(fetchedArticles);
      }

      // 더 이상 데이터가 없는지 확인
      setHasMore(fetchedArticles.length === ARTICLES_PER_PAGE);
      setOffset(currentOffset + fetchedArticles.length);

    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("아티클을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortOption, showLikedOnly, selectedCategories, searchQuery, fetchPopularArticles]);

  // Intersection Observer로 무한 스크롤 처리
  useEffect(() => {
    if (isIntersecting && hasMore && !loadingMore && !loading) {
      const newOffset = offset;
      fetchArticles(newOffset, true);
    }
  }, [isIntersecting, hasMore, loadingMore, loading, offset, fetchArticles]);

  // 필터 변경시 아티클 리셋 후 다시 로딩
  useEffect(() => {
    resetArticles();
    fetchArticles(0, false);
  }, [selectedCategories, sortOption, showLikedOnly, searchQuery, fetchArticles, resetArticles]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ArticleFilters
          selectedCategories={selectedCategories}
          sortOption={sortOption}
          onCategoryChange={handleCategoryChange}
          onSortChange={setSortOption}
          totalCount={0}
          showLikedOnly={showLikedOnly}
          onLikedOnlyChange={handleLikedOnlyChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="max-w-screen-2xl mx-auto px-4 py-8">
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
        selectedCategories={selectedCategories}
        sortOption={sortOption}
        onCategoryChange={handleCategoryChange}
        onSortChange={setSortOption}
        totalCount={articles.length}
        showLikedOnly={showLikedOnly}
        onLikedOnlyChange={handleLikedOnlyChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4 w-full">
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            {/* 무한 스크롤 트리거 */}
            {hasMore && (
              <div 
                ref={intersectionRef} 
                className="flex justify-center py-8 min-h-[100px]"
              >
                {loadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>더 많은 아티클을 불러오는 중...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 더 이상 불러올 데이터가 없을 때 */}
            {!hasMore && articles.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                모든 아티클을 불러왔습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};