import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../common/enums/permissions.enum';

// 사용자 설정 DTO
export class AdminUserSettingsDto {
  @ApiProperty({ example: 'light', enum: ['light', 'dark', 'sepia', 'navy', 'forest', 'lavender'] })
  theme: string;

  @ApiProperty({ example: 'ko', enum: ['ko', 'en'] })
  language: string;

  @ApiProperty({ example: true })
  notification: boolean;
}

// 카테고리 필드 DTO
export class AdminCategoryFieldDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '감독' })
  name: string;
}

// 카테고리 DTO
export class AdminCategoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '영화' })
  name: string;

  @ApiProperty({ example: '#FF5733', required: false })
  color?: string;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ type: [AdminCategoryFieldDto] })
  fields: AdminCategoryFieldDto[];

  @ApiProperty({ example: 10 })
  memoCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

// 메모 커스텀 필드 DTO
export class AdminMemoCustomFieldDto {
  @ApiProperty({ example: '감독' })
  fieldName: string;

  @ApiProperty({ example: '봉준호' })
  value: string;
}

// 평가 메모 DTO
export class AdminMemoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '기생충' })
  title: string;

  @ApiProperty({ example: '정말 인상깊은 영화였다', required: false })
  content?: string;

  @ApiProperty({ example: 4.5, required: false })
  rating?: number;

  @ApiProperty({ example: '2024-01-10T00:00:00.000Z', required: false })
  experienceDate?: Date;

  @ApiProperty({ example: '영화', required: false })
  categoryName?: string;

  @ApiProperty({ type: [AdminMemoCustomFieldDto] })
  customFields: AdminMemoCustomFieldDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

// 캘린더 메모 DTO
export class AdminCalendarMemoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '팀 미팅' })
  title: string;

  @ApiProperty({ example: '2024-01-20T09:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-01-20T10:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: false })
  isAllDay: boolean;

  @ApiProperty({ example: true })
  hasNotification: boolean;

  @ApiProperty({ example: 'TEN_MINUTES_BEFORE', required: false })
  notifyBefore?: string;

  @ApiProperty({ example: false })
  notificationSent: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

// 디바이스 DTO
export class AdminUserDeviceDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'ExponentPushToken[xxx]' })
  expoPushToken: string;

  @ApiProperty({ example: 'iPhone 15 Pro', required: false })
  deviceName?: string;

  @ApiProperty({ example: 'ios', required: false })
  platform?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z' })
  lastActiveAt: Date;
}

// 사용자 상세 응답 DTO
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

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: '계정 생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T15:45:00.000Z', description: '마지막 수정일' })
  updatedAt: Date;

  @ApiProperty({ type: AdminUserSettingsDto, description: '사용자 설정', required: false })
  settings?: AdminUserSettingsDto;

  @ApiProperty({ type: [AdminCategoryDto], description: '카테고리 목록' })
  categories: AdminCategoryDto[];

  @ApiProperty({ type: [AdminMemoDto], description: '평가 메모 목록' })
  memos: AdminMemoDto[];

  @ApiProperty({ type: [AdminCalendarMemoDto], description: '캘린더 메모 목록' })
  calendarMemos: AdminCalendarMemoDto[];

  @ApiProperty({ type: [AdminUserDeviceDto], description: '등록된 디바이스 목록' })
  devices: AdminUserDeviceDto[];
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
