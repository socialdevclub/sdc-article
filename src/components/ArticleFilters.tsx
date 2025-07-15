import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Heart, X, LogIn, LogOut, Search, Building2 } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginDialog } from "./LoginDialog";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useScrollHideHeader } from "@/hooks/useScrollHideHeader";
import { SOURCE_MAP } from "@/lib/getSourceFromUrl";

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
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const isHeaderVisible = useScrollHideHeader(100);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 소스 자동완성 필터링
  const filteredSources = useMemo(() => {
    if (!searchInput.trim() || showSuggestions === false) return [];
    
    const query = searchInput.toLowerCase();
    return Object.entries(SOURCE_MAP).filter(([domain, source]) => 
      source.name.toLowerCase().includes(query) && 
      domain !== selectedSource
    ).slice(0, 5); // 최대 5개까지만 표시
  }, [searchInput, selectedSource, showSuggestions]);

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
    let searchTerm = searchInput.trim();
    
    // 선택된 소스를 검색어에 포함
    if (selectedSource) {
      searchTerm = searchTerm ? `${searchTerm} (${selectedSource})` : selectedSource;
    }
    
    onSearchChange(searchTerm);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSources.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSources.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSources.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSources.length) {
          handleSourceSelect(filteredSources[highlightedIndex][0]);
        } else if (filteredSources.length > 0) {
          // 하이라이트된 항목이 없으면 첫 번째 제안을 선택
          handleSourceSelect(filteredSources[0][0]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setShowSuggestions(value.trim().length > 0);
    setHighlightedIndex(-1); // 검색어가 변경되면 하이라이트 초기화
  };

  const handleSourceSelect = (domain: string) => {
    setSelectedSource(domain);
    setSearchInput('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleRemoveSource = () => {
    setSelectedSource('');
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
            <a className="flex items-center gap-2" href="/">
              <img src="https://article.socialdev.club/favicon.png" alt="소티클" className="w-5 h-5" />
              <h2 className="text-xl font-semibold">소티클</h2>
            </a>
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

        {/* Search Input with Source Suggestions */}
        <div className="mb-4">
          {/* Selected Source */}
          {selectedSource && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 transition-colors"
              >
                <Building2 className="w-3 h-3 mr-1" />
                {SOURCE_MAP[selectedSource]?.name || selectedSource}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-2 hover:bg-transparent"
                  onClick={handleRemoveSource}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            </div>
          )}
          
          <div className="relative max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="제목, 내용, 카테고리, 작성자, 회사명으로 검색..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchInput.trim()) {
                    setShowSuggestions(true);
                    setHighlightedIndex(-1);
                  }
                }}
                onBlur={() => {
                  // 클릭 이벤트가 처리될 시간을 주기 위해 약간 지연
                  setTimeout(() => {
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }, 150);
                }}
                className="pl-10"
              />
              
              {/* 커스텀 드롭다운 */}
              {showSuggestions && filteredSources.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
                  {filteredSources.map(([domain, source], index) => (
                    <div
                      key={domain}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer first:rounded-t-md last:rounded-b-md transition-colors",
                        index === highlightedIndex 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault(); // 포커스가 나가는 것을 방지
                        handleSourceSelect(domain);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <Building2 className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-sm text-muted-foreground">{domain}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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