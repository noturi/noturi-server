import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminNotificationsService } from './admin-notifications.service';
import {
  CreateAdminNotificationDto,
  UpdateAdminNotificationDto,
  AdminNotificationQueryDto,
  AdminNotificationResponseDto,
  AdminNotificationDetailResponseDto,
  AdminNotificationListResponseDto,
  SendNotificationResultDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('admin - 푸시 알림 관리')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @ApiOperation({
    summary: '어드민 알림 생성',
    description: '즉시 발송, 예약 발송, 반복 발송 모두 지원. scheduledAt이 없고 isRepeat이 false면 즉시 발송됩니다.',
  })
  @ApiResponse({ status: 201, description: '생성 성공', type: AdminNotificationResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async create(@Body() dto: CreateAdminNotificationDto, @CurrentUser() user: any) {
    return this.adminNotificationsService.create(dto, user.id);
  }

  @Get()
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @ApiOperation({ summary: '어드민 알림 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AdminNotificationListResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async findAll(@Query() queryDto: AdminNotificationQueryDto) {
    return this.adminNotificationsService.findAll(queryDto);
  }

  @Get(':id')
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @ApiOperation({ summary: '어드민 알림 상세 조회 (발송 로그 포함)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AdminNotificationDetailResponseDto })
  @ApiResponse({ status: 404, description: '알림 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async findOne(@Param('id') id: string) {
    return this.adminNotificationsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @ApiOperation({ summary: '어드민 알림 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: AdminNotificationResponseDto })
  @ApiResponse({ status: 404, description: '알림 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateAdminNotificationDto) {
    return this.adminNotificationsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '어드민 알림 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '알림 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async delete(@Param('id') id: string) {
    await this.adminNotificationsService.delete(id);
  }

  @Post(':id/send')
  @RequirePermissions(Permission.MANAGE_NOTIFICATIONS)
  @ApiOperation({ summary: '알림 즉시 발송 (수동)', description: '이미 생성된 알림을 즉시 발송합니다.' })
  @ApiResponse({ status: 200, description: '발송 결과', type: SendNotificationResultDto })
  @ApiResponse({ status: 404, description: '알림 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async sendNow(@Param('id') id: string) {
    return this.adminNotificationsService.sendNow(id);
  }
}
