import { useCallback, memo } from "react";
import { Heart } from "lucide-react";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import { useAuth } from "@/hooks/useAuth";

interface ArticleLikesProps {
  articleId: string;
  onShowLogin: () => void;
  enabled?: boolean;
}

export const ArticleLikes = memo(({ articleId, onShowLogin, enabled = true }: ArticleLikesProps) => {
  const { isAuthenticated } = useAuth();
  const { likesCount, isLiked, toggleLike, isToggling, isLoading } = useArticleLikes(articleId, enabled);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      onShowLogin();
      return;
    }

    toggleLike();
  }, [isAuthenticated, toggleLike, onShowLogin]);

  // 로딩 중이거나 데이터 페칭이 비활성화된 경우 스켈레톤 표시
  if (isLoading || !enabled) {
    return <></>
  }

  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors ${isToggling ? 'opacity-70' : ''}`}
      onClick={handleLike}
    >
      <Heart className={`w-3 h-3 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
      <span>{likesCount}</span>
    </div>
  );
}); 