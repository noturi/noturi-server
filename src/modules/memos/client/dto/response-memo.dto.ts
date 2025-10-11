import { ApiProperty } from '@nestjs/swagger';

export class ResponseMemoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '메모 ID' })
  id: string;

  @ApiProperty({ example: '오늘의 회의 내용', description: '메모 제목' })
  title: string;

  @ApiProperty({ example: '프로젝트 진행 상황에 대해 논의했다.', description: '메모 내용', required: false })
  content?: string;

  @ApiProperty({ example: 4.5, description: '평점 (1.0~5.0)', required: false })
  rating?: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '카테고리 ID',
    required: false,
  })
  categoryId?: string;

  @ApiProperty({
    example: { id: '550e8400-e29b-41d4-a716-446655440000', name: '업무', color: '#FF6B6B' },
    description: '카테고리 정보',
    required: false,
  })
  category?: {
    id: string;
    name: string;
    color: string;
  };

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '수정일시' })
  updatedAt: Date;
}

export class MemoListResponseDto {
  @ApiProperty({ type: [ResponseMemoDto], description: '메모 목록' })
  data: ResponseMemoDto[];

  @ApiProperty({ example: 1, description: '현재 페이지' })
  page: number;

  @ApiProperty({ example: 20, description: '페이지당 항목 수' })
  limit: number;

  @ApiProperty({ example: 150, description: '전체 항목 수' })
  total: number;

  @ApiProperty({ example: 8, description: '전체 페이지 수' })
  totalPages: number;
}
