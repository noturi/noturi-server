import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { NotificationTime } from './create-calendar-memo.dto';

export class UpdateCalendarMemoDto {
  @ApiProperty({ example: '팀 회의', description: '일정 제목', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    example: '2024-12-25T14:00:00.000Z',
    description: '시작 날짜/시간',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-25T16:00:00.000Z',
    description: '끝 날짜/시간',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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