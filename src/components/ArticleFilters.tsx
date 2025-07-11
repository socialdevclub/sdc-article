import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, Heart, X, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "./LoginDialog";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useScrollHideHeader } from "@/hooks/useScrollHideHeader";

export const CATEGORIES = [
  "전체",
  "생산성",
  "커리어", 
  "프론트엔드",
  "백엔드",
  "데이터엔지니어링",
  "DevOps",
  "SRE",
  "AI",
  "SW엔지니어링",
  "개발팁",
  "QA",
  "PM/기획",
  "마케팅",
  "디자인",
  "HR"
];

export type SortOption = "latest" | "daily" | "weekly" | "monthly" | "popular:all";

interface ArticleFiltersProps {
  selectedCategories: string[];
  sortOption: SortOption;
  onCategoryChange: (categories: string[]) => void;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  showLikedOnly: boolean;
  onLikedOnlyChange: (showLikedOnly: boolean) => void;
}

export const ArticleFilters = ({
  selectedCategories,
  sortOption,
  onCategoryChange,
  onSortChange,
  totalCount,
  showLikedOnly,
  onLikedOnlyChange
}: ArticleFiltersProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const isHeaderVisible = useScrollHideHeader(100);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginClick = () => {
    setShowLoginDialog(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
  };

  const handleLikedOnlyChange = async (checked: boolean) => {
    if (checked && !user) {
      setShowLoginDialog(true);
      return;
    }
    onLikedOnlyChange(checked);
  };

  const handleCategoryClick = (category: string) => {
    if (category === "전체") {
      // "전체" 선택 시 모든 다른 카테고리 해제
      onCategoryChange(["전체"]);
    } else {
      // 다른 카테고리 선택 시
      let newCategories = [...selectedCategories];
      
      // "전체"가 선택되어 있으면 제거
      if (newCategories.includes("전체")) {
        newCategories = newCategories.filter(cat => cat !== "전체");
      }
      
      if (newCategories.includes(category)) {
        // 이미 선택된 카테고리면 제거
        newCategories = newCategories.filter(cat => cat !== category);
        
        // 아무것도 선택되지 않으면 "전체" 선택
        if (newCategories.length === 0) {
          newCategories = ["전체"];
        }
      } else {
        // 새로운 카테고리 추가
        newCategories.push(category);
      }
      
      onCategoryChange(newCategories);
    }
  };

  return (
    <div className={`bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/90 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="https://article.socialdev.club/favicon.png" alt="소티클" className="w-5 h-5" />
            <h2 className="text-xl font-semibold">소티클</h2>
            {/* Sort Options */}
            <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular:all">인기순</SelectItem>
                {/* <SelectItem value="weekly">주간 인기순</SelectItem>
                <SelectItem value="monthly">월간 인기순</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Login/Logout Button */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm">좋아요한 글만</span>
                  <Switch
                    checked={showLikedOnly}
                    onCheckedChange={handleLikedOnlyChange}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoginClick}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">로그인</span>
              </Button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category)}
                className={
                  isSelected
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "hover:bg-secondary/80 transition-smooth"
                }
              >
                {category}
                {isSelected && category !== "전체" && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};