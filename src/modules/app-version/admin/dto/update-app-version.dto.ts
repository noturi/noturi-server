import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateAppVersionDto {
  @ApiProperty({
    example: '1.1.0',
    description: 'iOS 최신 버전',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '버전은 x.x.x 형식이어야 합니다' })
  iosVersion?: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'iOS 최소 지원 버전 (이하면 강제 업데이트)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '버전은 x.x.x 형식이어야 합니다' })
  iosMinVersion?: string;

  @ApiProperty({
    example: 'https://apps.apple.com/app/id123456789',
    description: '앱스토어 URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  iosStoreUrl?: string;

  @ApiProperty({
    example: '1.1.0',
    description: 'Android 최신 버전',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '버전은 x.x.x 형식이어야 합니다' })
  androidVersion?: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'Android 최소 지원 버전 (이하면 강제 업데이트)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, { message: '버전은 x.x.x 형식이어야 합니다' })
  androidMinVersion?: string;

  @ApiProperty({
    example: 'https://play.google.com/store/apps/details?id=com.example.app',
    description: '플레이스토어 URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  androidStoreUrl?: string;
}
