// src/statistics/dto/query-statistics.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StatsQueryDto {
  @ApiPropertyOptional({ description: '조회할 연도 (YYYY)', example: 2024 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: '조회할 월 (1-12)', example: 7 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  month?: number;
}
