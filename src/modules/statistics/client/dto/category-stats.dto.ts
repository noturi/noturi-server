import { ApiProperty } from '@nestjs/swagger';

export class CategoryStatsResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '카테고리 ID' })
  id: string;

  @ApiProperty({ example: '업무', description: '카테고리 이름' })
  name: string;

  @ApiProperty({ example: '#FF6B6B', description: '카테고리 색상' })
  color: string;

  @ApiProperty({ example: 45, description: '메모 개수' })
  count: number;

  @ApiProperty({ example: 25.5, description: '전체 대비 비율 (%)' })
  percentage: number;

  @ApiProperty({ example: 4.3, description: '해당 카테고리 평균 평점' })
  averageRating: number;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z', description: '가장 최근 메모 작성일' })
  lastMemoDate?: string;

  @ApiProperty({ example: 15, description: '이번 달 메모 개수' })
  thisMonthCount: number;
}
