export class OverviewResponseDto {
  totalMemos: number;
  avgRating: number;
  totalCategories: number;
  bestExperiences: number;
  recommendedExperiences: number;
  avoidExperiences: number;
}

export class CategoryStatsItemDto {
  categoryId: string;
  categoryName: string;
  color?: string;
  count: number;
  avgRating: number;
  pattern: string;
  bestCount: number;
  worstCount: number;
  recentMemo?: {
    id: string;
    title: string;
    createdAt: Date;
  };
}

export class CategoriesResponseDto {
  data: CategoryStatsItemDto[];
}

export class RatingDistributionDto {
  rating: number;
  count: number;
  percentage: number;
}

export class CategoryPatternDto {
  category: string;
  avgRating: number;
  pattern: string;
}

export class TrendsResponseDto {
  ratingDistribution: RatingDistributionDto[];
  categoryPatterns: CategoryPatternDto[];
}

export class BestExperienceDto {
  id: string;
  title: string;
  category: string;
  rating: number;
  date: string;
}

export class BestResponseDto {
  data: BestExperienceDto[];
}

export class MonthlyStatsItemDto {
  month: number;
  count: number;
  avgRating: number;
  bestCount: number;
}

export class MonthlyResponseDto {
  year: number;
  data: MonthlyStatsItemDto[];
}

export class SummaryResponseDto {
  period: string;
  overview: OverviewResponseDto;
  topCategories: CategoryStatsItemDto[];
  bestExperiences: BestExperienceDto[];
}
