import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../common/enums/permissions.enum';

export class AdminUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '사용자 ID' })
  id: string;

  @ApiProperty({ example: 'john_doe', description: '닉네임' })
  nickname: string;

  @ApiProperty({ example: 'john@example.com', description: '이메일' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: '실제 이름', required: false })
  name?: string;

  @ApiProperty({ example: 'https://avatar.url/john.jpg', description: '아바타 URL', required: false })
  avatarUrl?: string;

  @ApiProperty({ example: ['GOOGLE', 'APPLE'], description: 'OAuth 제공자 목록', required: false })
  providers?: string[];

  @ApiProperty({ example: false, description: '통계 공개 여부' })
  isStatsPublic: boolean;

  @ApiProperty({ example: 'USER', description: '사용자 역할', enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: 125, description: '총 메모 개수' })
  memoCount: number;

  @ApiProperty({ example: 5, description: '카테고리 개수' })
  categoryCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '계정 생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z', description: '마지막 수정일' })
  updatedAt: Date;
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto], description: '사용자 목록' })
  data: AdminUserResponseDto[];

  @ApiProperty({ example: 1, description: '현재 페이지' })
  page: number;

  @ApiProperty({ example: 20, description: '페이지당 항목 수' })
  limit: number;

  @ApiProperty({ example: 150, description: '전체 항목 수' })
  total: number;

  @ApiProperty({ example: 8, description: '전체 페이지 수' })
  totalPages: number;
}
