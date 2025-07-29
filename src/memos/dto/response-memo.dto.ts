import { ApiProperty } from '@nestjs/swagger';

class MemoCategoryDto {
  @ApiProperty({ description: '카테고리 ID', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ description: '카테고리 이름', example: '영화' })
  name: string;

  @ApiProperty({ description: '카테고리 색상', example: '#FF6B6B', nullable: true })
  color?: string | null;
}

export class MemoDto {
  @ApiProperty({ description: '메모 ID', example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ description: '메모 제목', example: '인셉션 감상', nullable: true })
  title?: string | null;

  @ApiProperty({ description: '메모 내용', example: '꿈 속의 꿈...', nullable: true })
  content?: string | null;

  @ApiProperty({ description: '평점 (1.0 ~ 5.0)', example: 4.5 })
  rating: number;

  @ApiProperty({ description: '경험 날짜 (YYYY-MM-DD)', example: '2024-07-30', nullable: true })
  experienceDate?: Date | null;

  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정 일시' })
  updatedAt: Date;

  @ApiProperty({ type: () => MemoCategoryDto })
  category: MemoCategoryDto;
}

export class PaginatedMemosDto {
  @ApiProperty({ type: () => [MemoDto] })
  data: MemoDto[];

  @ApiProperty({
    description: '페이지네이션 메타 정보',
    example: { total: 100, page: 1, limit: 20, totalPages: 5 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
