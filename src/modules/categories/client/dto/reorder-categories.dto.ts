import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

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
}
