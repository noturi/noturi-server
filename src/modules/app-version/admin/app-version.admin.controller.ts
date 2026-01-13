import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AppVersionService } from '../app-version.service';
import { UpdateAppVersionDto } from './dto';
import { AppVersionAdminResponseDto } from '../dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';

@ApiTags('admin - 앱 버전 관리')
@Controller('admin/app-version')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AppVersionAdminController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  @RequirePermissions(Permission.MANAGE_SYSTEM)
  @ApiOperation({ summary: '앱 버전 정보 조회 (어드민)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AppVersionAdminResponseDto })
  async getAppVersion() {
    return this.appVersionService.getAppVersionForAdmin();
  }

  @Put()
  @RequirePermissions(Permission.MANAGE_SYSTEM)
  @ApiOperation({ summary: '앱 버전 정보 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: AppVersionAdminResponseDto })
  async updateAppVersion(@Body() dto: UpdateAppVersionDto) {
    return this.appVersionService.updateAppVersion(dto);
  }
}
