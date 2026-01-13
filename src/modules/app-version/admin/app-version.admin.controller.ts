import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppVersionService } from '../app-version.service';
import { UpdateAppVersionDto } from './dto';
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
  async getAppVersion() {
    return this.appVersionService.getAppVersionForAdmin();
  }

  @Put()
  @RequirePermissions(Permission.MANAGE_SYSTEM)
  @ApiOperation({ summary: '앱 버전 정보 수정' })
  async updateAppVersion(@Body() dto: UpdateAppVersionDto) {
    return this.appVersionService.updateAppVersion(dto);
  }
}
