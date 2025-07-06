import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, Heart } from "lucide-react";

export const CATEGORIES = [
  "전체",
  "생산성",
  "취업/이직", 
  "프론트엔드",
  "백엔드",
  "데이터엔지니어링",
  "DevOps",
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
  selectedCategory: string;
  sortOption: SortOption;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  showLikedOnly: boolean;
  onLikedOnlyChange: (showLikedOnly: boolean) => void;
}

export const ArticleFilters = ({
  selectedCategory,
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

  return (
    <div className="bg-card border-b border-border md:sticky md:top-0 z-10 backdrop-blur-sm bg-card/90">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">아티클 모음</h2>
            <Badge variant="outline" className="text-xs">
              {totalCount.toLocaleString()}개
            </Badge>
          </div>

          {/* Sort Options */}
          <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="daily">일간 인기</SelectItem>
              <SelectItem value="weekly">주간 인기</SelectItem>
              <SelectItem value="monthly">월간 인기</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liked Only Filter */}
        <div className="flex items-center gap-6">
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
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className={
                selectedCategory === category
                  ? "bg-gradient-primary text-primary-foreground shadow-soft"
                  : "hover:bg-secondary/80 transition-smooth"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};