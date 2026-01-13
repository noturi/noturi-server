import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateAppVersionDto } from './admin/dto/update-app-version.dto';

const FIXED_APP_VERSION = '1.1.1';

@Injectable()
export class AppVersionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 앱 버전 정보 조회 (클라이언트용)
   */
  async getAppVersion() {
    const appVersion = await this.prisma.appVersion.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!appVersion) {
      return {
        ios: {
          latestVersion: FIXED_APP_VERSION,
          minVersion: FIXED_APP_VERSION,
          storeUrl: '',
        },
        android: {
          latestVersion: FIXED_APP_VERSION,
          minVersion: FIXED_APP_VERSION,
          storeUrl: '',
        },
      };
    }

    return {
      ios: {
        latestVersion: FIXED_APP_VERSION,
        minVersion: FIXED_APP_VERSION,
        storeUrl: appVersion?.iosStoreUrl ?? '',
      },
      android: {
        latestVersion: FIXED_APP_VERSION,
        minVersion: FIXED_APP_VERSION,
        storeUrl: appVersion?.androidStoreUrl ?? '',
      },
    };
  }

  /**
   * 앱 버전 정보 수정 (어드민용)
   */
  async updateAppVersion(dto: UpdateAppVersionDto) {
    const existing = await this.prisma.appVersion.findFirst();

    if (existing) {
      return this.prisma.appVersion.update({
        where: { id: existing.id },
        data: {
          ...(dto.iosVersion !== undefined && { iosVersion: dto.iosVersion }),
          ...(dto.iosMinVersion !== undefined && { iosMinVersion: dto.iosMinVersion }),
          ...(dto.iosStoreUrl !== undefined && { iosStoreUrl: dto.iosStoreUrl }),
          ...(dto.androidVersion !== undefined && { androidVersion: dto.androidVersion }),
          ...(dto.androidMinVersion !== undefined && { androidMinVersion: dto.androidMinVersion }),
          ...(dto.androidStoreUrl !== undefined && { androidStoreUrl: dto.androidStoreUrl }),
        },
      });
    }

    // 없으면 생성
    return this.prisma.appVersion.create({
      data: {
        iosVersion: dto.iosVersion ?? '1.0.0',
        iosMinVersion: dto.iosMinVersion ?? '1.0.0',
        iosStoreUrl: dto.iosStoreUrl ?? '',
        androidVersion: dto.androidVersion ?? '1.0.0',
        androidMinVersion: dto.androidMinVersion ?? '1.0.0',
        androidStoreUrl: dto.androidStoreUrl ?? '',
      },
    });
  }

  /**
   * 앱 버전 상세 조회 (어드민용)
   */
  async getAppVersionForAdmin() {
    const appVersion = await this.prisma.appVersion.findFirst();

    if (!appVersion) {
      return null;
    }

    return appVersion;
  }
}
