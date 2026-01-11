import { ApiProperty } from '@nestjs/swagger';

// 발송 로그 DTO
export class AdminNotificationLogDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '2024-01-20T09:00:00.000Z' })
  sentAt: Date;

  @ApiProperty({ example: 10 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failCount: number;

  @ApiProperty({ example: { failedTokens: ['token1', 'token2'] }, required: false })
  details?: Record<string, any>;
}

// 알림 응답 DTO
export class AdminNotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '새로운 기능 출시!' })
  title: string;

  @ApiProperty({ example: '새로운 캘린더 기능을 확인해보세요.' })
  body: string;

  @ApiProperty({ example: { screen: 'Calendar' }, required: false })
  data?: Record<string, any>;

  @ApiProperty({ example: ['user-id-1', 'user-id-2'] })
  targetUserIds: string[];

  @ApiProperty({ example: 2, description: '대상 유저 수' })
  targetUserCount: number;

  @ApiProperty({ example: '2024-01-20T09:00:00.000Z', required: false })
  scheduledAt?: Date;

  @ApiProperty({ example: '09:00', required: false })
  scheduledTime?: string;

  @ApiProperty({ example: false })
  isRepeat: boolean;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '반복 요일' })
  repeatDays: number[];

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', required: false })
  repeatEndAt?: Date;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-20T09:00:00.000Z', required: false })
  lastSentAt?: Date;

  @ApiProperty({ example: 'admin-user-id' })
  createdBy: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

// 알림 상세 응답 DTO (로그 포함)
export class AdminNotificationDetailResponseDto extends AdminNotificationResponseDto {
  @ApiProperty({ type: [AdminNotificationLogDto], description: '발송 로그' })
  logs: AdminNotificationLogDto[];
}

// 알림 목록 응답 DTO
export class AdminNotificationListResponseDto {
  @ApiProperty({ type: [AdminNotificationResponseDto] })
  data: AdminNotificationResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

// 즉시 발송 결과 DTO
export class SendNotificationResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 10 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failCount: number;

  @ApiProperty({ example: '알림이 성공적으로 발송되었습니다.' })
  message: string;
}
