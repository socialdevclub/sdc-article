import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, Heart, X, LogIn, LogOut, User, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "./LoginDialog";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useScrollHideHeader } from "@/hooks/useScrollHideHeader";

export const CATEGORIES = [
  "전체",
  "커리어", 
  "프론트엔드",
  "백엔드",
  "SRE",
  "데이터엔지니어링",
  "DevOps",
  "AI",
  "SW엔지니어링",
  "개발팁",
  "생산성",
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ArticleFilters = ({
  selectedCategories,
  sortOption,
  onCategoryChange,
  onSortChange,
  totalCount,
  showLikedOnly,
  onLikedOnlyChange,
  searchQuery,
  onSearchChange
}: ArticleFiltersProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery); // 로컬 검색 입력용
  const isHeaderVisible = useScrollHideHeader(100);

  // searchQuery가 외부에서 변경되면 searchInput도 동기화
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

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

  const handleSearch = () => {
    onSearchChange(searchInput.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
              <SelectTrigger className="w-24">
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

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="제목, 내용, 카테고리, 작성자로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="default" className="px-4">
              검색
            </Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex md:flex-wrap gap-2 overflow-x-auto scrollbar-hide pb-2">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category)}
                className={`flex-shrink-0 ${
                  isSelected
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "hover:bg-secondary/80 transition-smooth"
                }`}
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