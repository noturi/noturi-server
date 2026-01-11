import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  ArrayNotEmpty,
  IsInt,
  Min,
  Max,
  Matches,
  IsObject,
} from 'class-validator';

export class CreateAdminNotificationDto {
  @ApiProperty({ example: '새로운 기능 출시!', description: '알림 제목' })
  @IsString()
  title: string;

  @ApiProperty({ example: '새로운 캘린더 기능을 확인해보세요.', description: '알림 내용' })
  @IsString()
  body: string;

  @ApiProperty({
    example: { screen: 'Calendar', params: { tab: 'new' } },
    description: '추가 데이터 (딥링크 등)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({
    example: ['user-id-1', 'user-id-2'],
    description: '대상 유저 ID 배열',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  targetUserIds: string[];

  @ApiProperty({
    example: '2024-01-20T09:00:00.000Z',
    description: '예약 발송 시간 (없으면 즉시 발송)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    example: '09:00',
    description: '반복시 매일 발송할 시간 (HH:mm 형식)',
    required: false,
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'scheduledTime은 HH:mm 형식이어야 합니다',
  })
  scheduledTime?: string;

  @ApiProperty({
    example: false,
    description: '반복 여부',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRepeat?: boolean;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: '반복 요일 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  repeatDays?: number[];

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: '반복 종료일',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  repeatEndAt?: string;
}
