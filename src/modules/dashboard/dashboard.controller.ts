import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, DashboardActivitiesResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/enums/permissions.enum';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('admin - 대시보드')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @RequirePermissions(Permission.READ_DASHBOARD)
  @ApiOperation({ summary: '대시보드 통계 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: DashboardStatsDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getStatistics(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStatistics();
  }

  @Get('activities')
  @RequirePermissions(Permission.READ_DASHBOARD)
  @ApiOperation({ summary: '최근 활동 내역 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: DashboardActivitiesResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getRecentActivities(): Promise<DashboardActivitiesResponseDto> {
    const activities = await this.dashboardService.getRecentActivities();
    return { activities };
  }
}