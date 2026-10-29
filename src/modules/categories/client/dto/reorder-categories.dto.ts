import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class CategoryOrderItem {
  @ApiProperty({ description: '카테고리 ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: '정렬 순서 (0부터 시작)' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderCategoriesDto {
  @ApiProperty({
    description: '카테고리 순서 목록',
    type: [CategoryOrderItem],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItem)
  categories: CategoryOrderItem[];

  @ApiPropertyOptional({
    description: '홈 카테고리 탭에서 "전체"의 위치 (0 = 맨 앞). 보내지 않으면 그대로 — 구버전 앱 호환',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  allCategoryOrder?: number;
}
