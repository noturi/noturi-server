import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from '../statistics.service';
import {
  QueryStatisticsDto,
  ResponseStatisticsDto,
  TrendsParamsDto,
  TrendsResponseDto,
  OverallStatsParamsDto,
  OverallStats,
  CategoryStatsResponse,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('통계')
@Controller('client/statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsClientController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('trends')
  @ApiOperation({ summary: '트렌드 분석 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: TrendsResponseDto })
  @ApiResponse({ status: 401, description: '인증 필요', type: ErrorResponseDto })
  async getTrends(@Request() req: AuthenticatedRequest, @Query() params: TrendsParamsDto) {
    return this.statisticsService.getTrends(req.user.id, params);
  }

  @Get('overview')
  @ApiOperation({ summary: '전체 통계 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: OverallStats })
  @ApiResponse({ status: 401, description: '인증 필요', type: ErrorResponseDto })
  async getOverallStats(@Request() req: AuthenticatedRequest, @Query() params: OverallStatsParamsDto) {
    return this.statisticsService.getOverallStats(req.user.id, params);
  }

  @Get('categories')
  @ApiOperation({ summary: '카테고리별 통계 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [CategoryStatsResponse] })
  @ApiResponse({ status: 401, description: '인증 필요', type: ErrorResponseDto })
  async getCategoryStats(@Request() req: AuthenticatedRequest) {
    return this.statisticsService.getCategoryStats(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '사용자 통계 조회 (기존 통합 API)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ResponseStatisticsDto })
  @ApiResponse({ status: 401, description: '인증 필요', type: ErrorResponseDto })
  async getUserStatistics(@Request() req: AuthenticatedRequest, @Query() queryDto: QueryStatisticsDto) {
    return this.statisticsService.getUserStatistics(req.user.id, queryDto);
  }
}
