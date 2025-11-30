import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum NotificationTime {
  AT_START_TIME = 'AT_START_TIME',
  FIVE_MINUTES_BEFORE = 'FIVE_MINUTES_BEFORE',
  TEN_MINUTES_BEFORE = 'TEN_MINUTES_BEFORE',
  FIFTEEN_MINUTES_BEFORE = 'FIFTEEN_MINUTES_BEFORE',
  THIRTY_MINUTES_BEFORE = 'THIRTY_MINUTES_BEFORE',
  ONE_HOUR_BEFORE = 'ONE_HOUR_BEFORE',
  TWO_HOURS_BEFORE = 'TWO_HOURS_BEFORE',
  THREE_HOURS_BEFORE = 'THREE_HOURS_BEFORE',
  ONE_DAY_BEFORE = 'ONE_DAY_BEFORE',
  TWO_DAYS_BEFORE = 'TWO_DAYS_BEFORE',
  THREE_DAYS_BEFORE = 'THREE_DAYS_BEFORE',
  ONE_WEEK_BEFORE = 'ONE_WEEK_BEFORE',
}

export class CreateCalendarMemoDto {
  @ApiProperty({ example: '팀 회의', description: '일정 제목' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: '2024-12-25T14:00:00.000Z',
    description: '시작 날짜/시간',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2024-12-25T16:00:00.000Z',
    description: '끝 날짜/시간',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: true, description: '알림 설정 여부', required: false })
  @IsOptional()
  @IsBoolean()
  hasNotification?: boolean;

  @ApiProperty({
    enum: NotificationTime,
    example: NotificationTime.ONE_HOUR_BEFORE,
    description: '시작 시간 기준 알림 시점',
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationTime)
  notifyBefore?: NotificationTime;
}