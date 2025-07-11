import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

const AUTH_QUERY_KEY = ["auth", "user"];

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지
    gcTime: 1000 * 60 * 10, // 10분 동안 가비지 컬렉션 방지
  });

  // 인증 상태 변경 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.setQueryData(AUTH_QUERY_KEY, session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          queryClient.setQueryData(AUTH_QUERY_KEY, null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}; 