import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, IsHexColor, MinLength, MaxLength } from 'class-validator';

export class CreateDefaultCategoryDto {
  @ApiProperty({ example: '영화', description: '카테고리 이름' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '#FF6B6B', description: '카테고리 색상 (HEX 코드)' })
  @IsString()
  @IsHexColor()
  color: string;

  @ApiProperty({ example: '영화 관련 메모를 위한 카테고리', description: '카테고리 설명', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ example: 1, description: '정렬 순서', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ example: true, description: '활성화 상태', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDefaultCategoryDto {
  @ApiProperty({ example: '영화', description: '카테고리 이름', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiProperty({ example: '#FF6B6B', description: '카테고리 색상 (HEX 코드)', required: false })
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;

  @ApiProperty({ example: '영화 관련 메모를 위한 카테고리', description: '카테고리 설명', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ example: 1, description: '정렬 순서', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ example: true, description: '활성화 상태', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DefaultCategoryResponseDto {
  @ApiProperty({ example: 'uuid', description: '카테고리 ID' })
  id: string;

  @ApiProperty({ example: '영화', description: '카테고리 이름' })
  name: string;

  @ApiProperty({ example: '#FF6B6B', description: '카테고리 색상 (HEX 코드)' })
  color: string;

  @ApiProperty({ example: '영화 관련 메모를 위한 카테고리', description: '카테고리 설명', required: false })
  description?: string;

  @ApiProperty({ example: 1, description: '정렬 순서' })
  sortOrder: number;

  @ApiProperty({ example: true, description: '활성화 상태' })
  isActive: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
