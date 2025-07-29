// src/memos/dto/query-memo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryMemoDto {
  @ApiPropertyOptional({ description: '카테고리 ID로 필터링', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @ApiPropertyOptional({ description: '평점으로 필터링', example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  @Transform(({ value }) => parseFloat(value))
  rating?: number;

  @ApiPropertyOptional({ description: '제목과 내용에서 검색', example: '인셉션' })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 당 항목 수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '정렬 필드', enum: ['createdAt', 'rating', 'title'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'rating' | 'title' = 'createdAt';

  @ApiPropertyOptional({ description: '정렬 순서', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: '조회 시작 날짜 (YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string; // YYYY-MM-DD

  @ApiPropertyOptional({ description: '조회 종료 날짜 (YYYY-MM-DD)', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string; // YYYY-MM-DD
}
