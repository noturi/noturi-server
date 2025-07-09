// src/statistics/dto/query-statistics.dto.ts
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryOverviewDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(2020)
  @Max(2030)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class QueryCategoriesDto extends QueryOverviewDto {}

export class QueryTrendsDto extends QueryOverviewDto {}

export class QueryBestDto extends QueryOverviewDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class QueryMonthlyDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(2020)
  @Max(2030)
  year: number;
}
