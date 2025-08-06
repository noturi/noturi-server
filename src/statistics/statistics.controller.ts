// src/statistics/statistics.controller.ts
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/auth.types';
import { StatsQueryDto } from './dto';
import {
  BestResponseDto,
  CategoriesResponseDto,
  MonthlyResponseDto,
  OverviewResponseDto,
  SummaryResponseDto,
  TrendsResponseDto,
} from './dto/response-statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '전체 통계 개요', description: '지정된 기간의 전체 통계 개요를 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: OverviewResponseDto })
  getOverview(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    return this.statisticsService.getOverviewStats(userId, query.year, query.month);
  }

  @Get('categories')
  @ApiOperation({ summary: '카테고리별 통계', description: '지정된 기간의 카테고리별 통계를 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: CategoriesResponseDto })
  async getCategoryStats(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    const data = await this.statisticsService.getCategoryStats(userId, query.year, query.month);
    return { data };
  }

  @Get('trends')
  @ApiOperation({ summary: '트렌드 분석', description: '지정된 기간의 별점 분포 및 평가 패턴을 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: TrendsResponseDto })
  getTrends(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    return this.statisticsService.getTrendStats(userId, query.year, query.month);
  }

  @Get('best')
  @ApiOperation({ summary: '베스트 경험 조회', description: '지정된 기간의 베스트 경험(4.5점 이상)들을 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: BestResponseDto })
  async getBestExperiences(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    const data = await this.statisticsService.getBestExperiences(userId, 10, query.year, query.month);
    return { data };
  }

  @Get('worst')
  @ApiOperation({ summary: '비추천 경험 조회', description: '지정된 기간의 비추천 경험(2.5점 이하)들을 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: BestResponseDto })
  async getWorstExperiences(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    const data = await this.statisticsService.getWorstExperiences(userId, 5, query.year, query.month);
    return { data };
  }

  @Get('monthly')
  @ApiOperation({ summary: '월별 통계', description: '지정된 연도의 월별 통계를 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: MonthlyResponseDto })
  async getMonthlyStats(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    const data = await this.statisticsService.getMonthlyStats(userId, query.year!);
    return { year: query.year, data };
  }

  @Get('summary')
  @ApiOperation({ summary: '통계 요약 (공유용)', description: '지정된 기간의 통계 요약을 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: SummaryResponseDto })
  getSummary(@Request() req: AuthenticatedRequest, @Query() query: StatsQueryDto) {
    const userId = req.user.id;
    return this.statisticsService.getStatsSummary(userId, query.year, query.month);
  }
}
