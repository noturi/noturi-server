import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiProperty({ 
    description: '페이지 번호 (1부터 시작)', 
    example: 1,
    minimum: 1,
    required: false,
    default: 1 
  })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  page: number = 1;

  @ApiProperty({ 
    description: '페이지당 항목 수', 
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10 
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 항목 수', example: 50 })
  totalItems: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
  hasPrev: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}