import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, Heart, X } from "lucide-react";

export const CATEGORIES = [
  "전체",
  "생산성",
  "취업/이직", 
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

export type SortOption = "latest" | "daily" | "weekly" | "monthly";

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
  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "latest": return "최신순";
      case "daily": return "일간 인기";
      case "weekly": return "주간 인기";
      case "monthly": return "월간 인기";
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

  const removeCategoryFilter = (categoryToRemove: string) => {
    const newCategories = selectedCategories.filter(cat => cat !== categoryToRemove);
    if (newCategories.length === 0) {
      onCategoryChange(["전체"]);
    } else {
      onCategoryChange(newCategories);
    }
  };

  return (
    <div className="bg-card border-b border-border md:sticky md:top-0 z-10 backdrop-blur-sm bg-card/90">
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">아티클 모음</h2>
            <Badge variant="secondary" className="text-xs">
              {totalCount}개
            </Badge>
          </div>

          {/* Sort Options */}
          <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="daily">일간 인기순</SelectItem>
              <SelectItem value="weekly">주간 인기순</SelectItem>
              <SelectItem value="monthly">월간 인기순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Categories Display */}
        {selectedCategories.length > 0 && !selectedCategories.includes("전체") && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-muted-foreground mr-2">선택된 카테고리:</span>
            {selectedCategories.map((category) => (
              <Badge 
                key={category} 
                variant="default" 
                className="flex items-center gap-1"
              >
                {category}
                <X 
                  className="w-3 h-3 cursor-pointer hover:bg-primary-foreground/20 rounded" 
                  onClick={() => removeCategoryFilter(category)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Liked Only Filter */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm">좋아요한 글만</span>
            <Switch
              checked={showLikedOnly}
              onCheckedChange={onLikedOnlyChange}
            />
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
    </div>
  );
};