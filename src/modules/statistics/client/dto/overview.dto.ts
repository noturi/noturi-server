import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class OverallStatsParamsDto {
  @ApiProperty({
    example: 2024,
    description: '조회할 연도',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year?: number;

  @ApiProperty({
    example: 3,
    description: '조회할 월 (1-12)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;
}

export class OverallStats {
  @ApiProperty({ example: 250, description: '총 메모 개수' })
  totalMemos: number;

  @ApiProperty({ example: 8, description: '총 카테고리 개수' })
  totalCategories: number;

  @ApiProperty({ example: 45, description: '이번 달 메모 개수' })
  thisMonthMemos: number;

  @ApiProperty({ example: 38, description: '지난 달 메모 개수' })
  lastMonthMemos: number;

  @ApiProperty({ example: 18.4, description: '지난 달 대비 증감률 (%)' })
  growthRate: number;

  @ApiProperty({ example: 4.2, description: '전체 평균 평점' })
  averageRating: number;

  @ApiProperty({ example: 8.3, description: '일일 평균 메모 작성 수' })
  dailyAverage: number;

  @ApiProperty({ example: '2024-03-15', description: '가장 최근 메모 작성일' })
  lastMemoDate?: string;

  @ApiProperty({ example: 85, description: '이번 달 활동 일수' })
  activeDaysThisMonth: number;
}
