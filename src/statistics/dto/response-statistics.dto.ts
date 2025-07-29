import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemoDto } from 'src/memos/dto';

export class OverviewResponseDto {
  @ApiProperty({ description: '총 메모 개수' })
  totalMemos: number;
  @ApiProperty({ description: '평균 평점' })
  avgRating: number;
  @ApiProperty({ description: '총 카테고리 개수' })
  totalCategories: number;
  @ApiProperty({ description: '최고 경험 개수 (4.5+)' })
  bestExperiences: number;
  @ApiProperty({ description: '추천 경험 개수 (4.0+)' })
  recommendedExperiences: number;
  @ApiProperty({ description: '아쉬운 경험 개수 (2.5-)' })
  avoidExperiences: number;
}

class CategoryStatsItemDto {
  @ApiProperty()
  categoryId: string;
  @ApiProperty()
  categoryName: string;
  @ApiPropertyOptional()
  color?: string;
  @ApiProperty({ description: '메모 개수' })
  count: number;
  @ApiProperty({ description: '평균 평점' })
  avgRating: number;
  @ApiProperty({ description: '평가 패턴' })
  pattern: string;
  @ApiProperty({ description: '최고 경험 개수' })
  bestCount: number;
  @ApiProperty({ description: '아쉬운 경험 개수' })
  worstCount: number;
  @ApiPropertyOptional({
    description: '최근 메모',
    example: { id: 'uuid', title: '최근 메모 제목', createdAt: '2024-07-29T00:00:00.000Z' }
  })
  recentMemo?: {
    id: string;
    title: string;
    createdAt: Date;
  };
}

export class CategoriesResponseDto {
  @ApiProperty({ type: () => [CategoryStatsItemDto] })
  data: CategoryStatsItemDto[];
}

export class RatingDistributionDto {
  @ApiProperty()
  rating: number;
  @ApiProperty()
  count: number;
  @ApiProperty()
  percentage: number;
}

export class CategoryPatternDto {
  @ApiProperty()
  category: string;
  @ApiProperty()
  avgRating: number;
  @ApiProperty()
  pattern: string;
}

export class TrendsResponseDto {
  @ApiProperty({ type: () => [RatingDistributionDto] })
  ratingDistribution: RatingDistributionDto[];
  @ApiProperty({ type: () => [CategoryPatternDto] })
  categoryPatterns: CategoryPatternDto[];
}

export class BestResponseDto {
  @ApiProperty({ type: () => [MemoDto] })
  data: MemoDto[];
}

export class MonthlyStatsItemDto {
  @ApiProperty()
  month: number;
  @ApiProperty()
  count: number;
  @ApiProperty()
  avgRating: number;
  @ApiProperty()
  bestCount: number;
}

export class MonthlyResponseDto {
  @ApiProperty()
  year: number;
  @ApiProperty({ type: () => [MonthlyStatsItemDto] })
  data: MonthlyStatsItemDto[];
}

export class SummaryResponseDto {
  @ApiProperty()
  period: string;
  @ApiProperty({ type: () => OverviewResponseDto })
  overview: OverviewResponseDto;
  @ApiProperty({ type: () => [CategoryStatsItemDto] })
  topCategories: CategoryStatsItemDto[];
  @ApiProperty({ type: () => [MemoDto] })
  bestExperiences: MemoDto[];
}
