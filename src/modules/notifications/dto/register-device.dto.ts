import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

export class RegisterDeviceDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo Push Token',
  })
  @IsString()
  @Matches(/^ExponentPushToken\[.+\]$/, {
    message: '유효한 Expo Push Token 형식이 아닙니다.',
  })
  expoPushToken: string;

  @ApiProperty({
    example: 'iPhone 15 Pro',
    description: '기기 이름',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({
    example: 'ios',
    description: '플랫폼 (ios, android)',
    enum: DevicePlatform,
    required: false,
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}

export class DeviceResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  expoPushToken: string;

  @ApiProperty({ example: 'iPhone 15 Pro', required: false, nullable: true })
  deviceName: string | null;

  @ApiProperty({ example: 'ios', required: false, nullable: true })
  platform: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-10-10T07:07:02.934Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-10T07:07:02.934Z' })
  lastActiveAt: Date;
}

