import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryMemoDto {
  @ApiProperty({
    example: '회의',
    description: '검색 키워드 (제목 또는 내용)',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '카테고리 ID로 필터링',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    example: 2024,
    description: '년도로 필터링',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiProperty({
    example: 4.0,
    description: '최소 평점 (1.0~5.0)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    example: 5.0,
    description: '최대 평점 (1.0~5.0)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiProperty({
    example: 1,
    description: '페이지 번호 (1부터 시작)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: '페이지당 항목 수',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
