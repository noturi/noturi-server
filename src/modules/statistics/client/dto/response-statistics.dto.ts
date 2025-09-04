import { ApiProperty } from '@nestjs/swagger';

export class CategoryStatisticsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '카테고리 ID' })
  id: string;

  @ApiProperty({ example: '업무', description: '카테고리 이름' })
  name: string;

  @ApiProperty({ example: '#FF6B6B', description: '카테고리 색상' })
  color: string;

  @ApiProperty({ example: 25, description: '메모 개수' })
  count: number;

  @ApiProperty({ example: 15.5, description: '전체 대비 비율 (%)' })
  percentage: number;
}

export class PeriodStatisticsDto {
  @ApiProperty({ example: '2024-01', description: '기간 (연-월 또는 연-월-일)' })
  period: string;

  @ApiProperty({ example: 42, description: '해당 기간 메모 개수' })
  count: number;
}

export class ResponseStatisticsDto {
  @ApiProperty({ example: 150, description: '전체 메모 개수' })
  totalMemos: number;

  @ApiProperty({ example: 5, description: '전체 카테고리 개수' })
  totalCategories: number;

  @ApiProperty({ example: 25, description: '이번 달 작성한 메모 개수' })
  thisMonthMemos: number;

  @ApiProperty({ example: 18, description: '지난 달 작성한 메모 개수' })
  lastMonthMemos: number;

  @ApiProperty({ example: 38.9, description: '지난 달 대비 증감률 (%)' })
  growthRate: number;

  @ApiProperty({
    type: [CategoryStatisticsDto],
    description: '카테고리별 통계',
  })
  categoryStats: CategoryStatisticsDto[];

  @ApiProperty({
    type: [PeriodStatisticsDto],
    description: '기간별 통계',
  })
  periodStats: PeriodStatisticsDto[];

  @ApiProperty({ example: '2024-01-15', description: '가장 최근 메모 작성일' })
  lastMemoDate?: string;

  @ApiProperty({ example: 5.2, description: '일일 평균 메모 작성 개수' })
  averageMemosPerDay: number;
}
