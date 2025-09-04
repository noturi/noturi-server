import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class TrendsParamsDto {
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

export class TrendDataPoint {
  @ApiProperty({ example: '2024-03-01', description: '날짜' })
  date: string;

  @ApiProperty({ example: 5, description: '메모 개수' })
  count: number;

  @ApiProperty({ example: 4.2, description: '평균 평점' })
  averageRating: number;
}

export class TrendsResponseDto {
  @ApiProperty({ type: [TrendDataPoint], description: '트렌드 데이터' })
  trends: TrendDataPoint[];

  @ApiProperty({ example: 156, description: '해당 기간 총 메모 수' })
  totalMemos: number;

  @ApiProperty({ example: 4.3, description: '해당 기간 평균 평점' })
  averageRating: number;

  @ApiProperty({ example: 15.2, description: '이전 기간 대비 증감률 (%)' })
  growthRate: number;
}
