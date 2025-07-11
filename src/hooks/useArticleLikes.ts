import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const LIKES_QUERY_KEY = (articleId: string) => ["likes", articleId];

export const useArticleLikes = (articleId: string) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // 좋아요 정보 조회
  const { data: likesData, isLoading } = useQuery({
    queryKey: LIKES_QUERY_KEY(articleId),
    queryFn: async () => {
      // 좋아요 총 개수 조회
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("article_id", articleId);

      let isLiked = false;
      
      // 로그인된 사용자가 있다면 좋아요 여부 확인
      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("article_id", articleId)
          .eq("user_id", user.id)
          .single();
        
        isLiked = !!data;
      }

      return {
        count: count || 0,
        isLiked,
      };
    },
    staleTime: 1000 * 60 * 2, // 2분 동안 캐시 유지
    gcTime: 1000 * 60 * 5, // 5분 동안 가비지 컬렉션 방지
  });

  // 좋아요 토글 뮤테이션
  const likeMutation = useMutation({
    mutationFn: async ({ action }: { action: 'like' | 'unlike' }) => {
      if (!user) throw new Error('User not authenticated');

      if (action === 'like') {
        await supabase
          .from("likes")
          .insert({
            article_id: articleId,
            user_id: user.id
          });
      } else {
        await supabase
          .from("likes")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", user.id);
      }
    },
    onMutate: async ({ action }) => {
      // 낙관적 업데이트
      await queryClient.cancelQueries({ queryKey: LIKES_QUERY_KEY(articleId) });
      
      const previousData = queryClient.getQueryData(LIKES_QUERY_KEY(articleId));
      
      queryClient.setQueryData(LIKES_QUERY_KEY(articleId), (old: { count: number; isLiked: boolean } | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          count: action === 'like' ? old.count + 1 : old.count - 1,
          isLiked: action === 'like',
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // 에러 발생 시 이전 상태로 복구
      if (context?.previousData) {
        queryClient.setQueryData(LIKES_QUERY_KEY(articleId), context.previousData);
      }
    },
    onSettled: () => {
      // 최종적으로 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY(articleId) });
    },
  });

  const toggleLike = () => {
    if (!isAuthenticated) return null;
    
    const action = likesData?.isLiked ? 'unlike' : 'like';
    return likeMutation.mutate({ action });
  };

  return {
    likesCount: likesData?.count || 0,
    isLiked: likesData?.isLiked || false,
    isLoading,
    toggleLike,
    isToggling: likeMutation.isPending,
  };
}; 