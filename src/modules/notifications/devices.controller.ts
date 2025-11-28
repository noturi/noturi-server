import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceDto, DeviceResponseDto } from './dto';

@ApiTags('client - 디바이스 (푸시 알림)')
@Controller('client/devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '디바이스 등록 (푸시 토큰)' })
  @ApiResponse({ status: 201, description: '등록 성공', type: DeviceResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ): Promise<DeviceResponseDto> {
    // 기존에 같은 토큰이 있으면 업데이트, 없으면 생성
    const device = await this.prisma.userDevice.upsert({
      where: { expoPushToken: dto.expoPushToken },
      update: {
        userId, // 다른 사용자가 같은 디바이스로 로그인하면 소유자 변경
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

    return device;
  }

  @Get()
  @ApiOperation({ summary: '내 디바이스 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [DeviceResponseDto] })
  async getMyDevices(
    @CurrentUser('id') userId: string,
  ): Promise<DeviceResponseDto[]> {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '디바이스 삭제 (푸시 알림 해제)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '디바이스를 찾을 수 없음' })
  async removeDevice(
    @CurrentUser('id') userId: string,
    @Param('id') deviceId: string,
  ): Promise<void> {
    await this.prisma.userDevice.deleteMany({
      where: {
        id: deviceId,
        userId, // 본인 디바이스만 삭제 가능
      },
    });
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '모든 디바이스 삭제 (모든 푸시 알림 해제)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  async removeAllDevices(
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.prisma.userDevice.deleteMany({
      where: { userId },
    });
  }
}

