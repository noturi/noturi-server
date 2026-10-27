import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // 앱 실행 시 토큰 갱신: 알림을 끈 사용자를 다시 켜지 않도록, 켜진 경우에만 토큰을 갱신하고 설정은 건드리지 않는다
    if (dto.refreshOnly) {
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
        select: { notification: true },
      });
      if (!settings?.notification) {
        return null;
      }
      return this.upsertDevice(userId, dto);
    }

    const device = await this.upsertDevice(userId, dto);

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, notification: true },
      update: { notification: true },
    });

    return device;
  }

  private upsertDevice(userId: string, dto: RegisterDeviceDto) {
    return this.prisma.userDevice.upsert({
      where: { expoPushToken: dto.expoPushToken },
      update: {
        userId,
        deviceName: dto.deviceName,
        platform: dto.platform,
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        expoPushToken: dto.expoPushToken,
        deviceName: dto.deviceName,
        platform: dto.platform,
        isActive: true,
      },
    });
  }

  async getMyDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async removeDevice(userId: string, deviceId: string) {
    await this.prisma.userDevice.deleteMany({
      where: {
        id: deviceId,
        userId,
      },
    });

    const remaining = await this.prisma.userDevice.count({
      where: { userId },
    });

    if (remaining === 0) {
      await this.prisma.userSettings.updateMany({
        where: { userId },
        data: { notification: false },
      });
    }
  }

  async removeAllDevices(userId: string) {
    await this.prisma.userDevice.deleteMany({
      where: { userId },
    });

    await this.prisma.userSettings.updateMany({
      where: { userId },
      data: { notification: false },
    });
  }
}
