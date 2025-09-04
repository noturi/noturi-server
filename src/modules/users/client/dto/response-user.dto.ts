import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserDto {
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

  @ApiProperty({ example: false, description: '통계 공개 여부' })
  isStatsPublic: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '계정 생성일' })
  createdAt: Date;
}

export class UserProfileDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '사용자 ID' })
  id: string;

  @ApiProperty({ example: 'john_doe', description: '닉네임' })
  nickname: string;

  @ApiProperty({ example: 'John Doe', description: '실제 이름', required: false })
  name?: string;

  @ApiProperty({ example: 'https://avatar.url/john.jpg', description: '아바타 URL', required: false })
  avatarUrl?: string;

  @ApiProperty({ example: false, description: '통계 공개 여부' })
  isStatsPublic: boolean;

  @ApiProperty({ example: 125, description: '총 메모 개수' })
  totalMemos: number;

  @ApiProperty({ example: 5, description: '카테고리 개수' })
  totalCategories: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '계정 생성일' })
  createdAt: Date;
}
