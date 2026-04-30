import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.userDevice.upsert({
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

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, notification: true },
      update: { notification: true },
    });

    return device;
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
