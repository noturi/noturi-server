import { ApiProperty } from '@nestjs/swagger';

export class PlatformVersionDto {
  @ApiProperty({ example: '1.1.0', description: '최신 버전' })
  latestVersion: string;

  @ApiProperty({ example: '1.0.0', description: '최소 지원 버전' })
  minVersion: string;

  @ApiProperty({ example: 'https://apps.apple.com/app/id123456789', description: '스토어 URL' })
  storeUrl: string;
}

export class AppVersionResponseDto {
  @ApiProperty({ type: PlatformVersionDto, description: 'iOS 버전 정보' })
  ios: PlatformVersionDto;

  @ApiProperty({ type: PlatformVersionDto, description: 'Android 버전 정보' })
  android: PlatformVersionDto;
}

export class AppVersionAdminResponseDto {
  @ApiProperty({ example: 'uuid', description: 'ID' })
  id: string;

  @ApiProperty({ example: '1.1.0', description: 'iOS 최신 버전' })
  iosVersion: string;

  @ApiProperty({ example: '1.0.0', description: 'iOS 최소 지원 버전' })
  iosMinVersion: string;

  @ApiProperty({ example: 'https://apps.apple.com/app/id123456789', description: '앱스토어 URL' })
  iosStoreUrl: string;

  @ApiProperty({ example: '1.1.0', description: 'Android 최신 버전' })
  androidVersion: string;

  @ApiProperty({ example: '1.0.0', description: 'Android 최소 지원 버전' })
  androidMinVersion: string;

  @ApiProperty({ example: 'https://play.google.com/store/apps/details?id=...', description: '플레이스토어 URL' })
  androidStoreUrl: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
