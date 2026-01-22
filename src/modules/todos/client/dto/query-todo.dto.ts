import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTodoDto {
  @ApiProperty({
    example: '2026-01-22',
    description: '특정 날짜 조회 (date가 있으면 year/month 무시)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 2026, description: '년도 (월별 조회용)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiProperty({ example: 1, description: '월 (월별 조회용)', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class QueryStatsDto {
  @ApiProperty({ example: 2026, description: '년도', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiProperty({ example: 1, description: '월', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
