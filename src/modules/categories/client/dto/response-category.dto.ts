// src/categories/dto/response-category.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class CategoryCountDto {
  @ApiProperty({ description: '카테고리에 속한 메모의 개수', example: 5 })
  memos: number;
}

export class CategoryDto {
  @ApiProperty({ description: '카테고리 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '영화' })
  name: string;

  @ApiProperty({ description: '카테고리 색상 (Hex 코드)', example: '#FF6B6B', required: false, nullable: true })
  color: string | null;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ type: () => CategoryCountDto, description: '카테고리 통계' })
  count: CategoryCountDto;
}
