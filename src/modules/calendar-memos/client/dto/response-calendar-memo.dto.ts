import { ApiProperty } from '@nestjs/swagger';
import { NotificationTime } from './create-calendar-memo.dto';

export class ResponseCalendarMemoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '일정 ID' })
  id: string;

  @ApiProperty({ example: '팀 회의', description: '일정 제목' })
  title: string;

  @ApiProperty({ example: '2024-12-25T14:00:00.000Z', description: '시작 날짜/시간' })
  startDate: Date;

  @ApiProperty({ example: '2024-12-25T16:00:00.000Z', description: '끝 날짜/시간' })
  endDate: Date;

  @ApiProperty({ example: true, description: '알림 설정 여부' })
  hasNotification: boolean;

  @ApiProperty({
    enum: NotificationTime,
    example: NotificationTime.ONE_HOUR_BEFORE,
    description: '알림 시점',
    nullable: true,
  })
  notifyBefore: NotificationTime | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: '수정 시간' })
  updatedAt: Date;
}

export class CalendarMemoListResponseDto {
  @ApiProperty({ type: [ResponseCalendarMemoDto], description: '일정 목록' })
  data: ResponseCalendarMemoDto[];

  @ApiProperty({ example: 1, description: '현재 페이지' })
  page: number;

  @ApiProperty({ example: 20, description: '페이지당 개수' })
  limit: number;

  @ApiProperty({ example: 100, description: '전체 개수' })
  total: number;

  @ApiProperty({ example: 5, description: '전체 페이지 수' })
  totalPages: number;
}