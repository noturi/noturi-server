// src/memos/dto/query-memo.dto.ts
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryMemoDto {
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  @Transform(({ value }) => parseFloat(value))
  rating?: number;

  @IsOptional()
  @IsString()
  search?: string;
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'rating' | 'title' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsDateString()
  startDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  endDate?: string; // YYYY-MM-DD
}
