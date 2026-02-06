import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
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
  }

  async removeAllDevices(userId: string) {
    await this.prisma.userDevice.deleteMany({
      where: { userId },
    });
  }
}
