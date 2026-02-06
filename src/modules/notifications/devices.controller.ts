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
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceDto, DeviceResponseDto } from './dto';

@ApiTags('client - 디바이스 (푸시 알림)')
@Controller('client/devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: '디바이스 등록 (푸시 토큰)' })
  @ApiResponse({ status: 201, description: '등록 성공', type: DeviceResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.registerDevice(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 디바이스 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [DeviceResponseDto] })
  async getMyDevices(
    @CurrentUser('id') userId: string,
  ): Promise<DeviceResponseDto[]> {
    return this.devicesService.getMyDevices(userId);
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
    await this.devicesService.removeDevice(userId, deviceId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '모든 디바이스 삭제 (모든 푸시 알림 해제)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  async removeAllDevices(
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.devicesService.removeAllDevices(userId);
  }
}
