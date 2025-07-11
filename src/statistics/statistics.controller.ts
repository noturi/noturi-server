// src/statistics/statistics.controller.ts
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 경로 수정
import {
  QueryBestDto,
  QueryCategoriesDto,
  QueryMonthlyDto,
  QueryOverviewDto,
  QueryTrendsDto,
} from './dto/query-statistics.dto';
import {
  BestResponseDto,
  CategoriesResponseDto,
  MonthlyResponseDto,
  OverviewResponseDto,
  SummaryResponseDto,
  TrendsResponseDto,
} from './dto/response-statistics.dto';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview(@Request() req, @Query() query: QueryOverviewDto): Promise<OverviewResponseDto> {
    const userId = req.user.id; // JWT에서 실제 사용자 ID 가져오기
    return this.statisticsService.getOverviewStats(userId, query.year, query.month);
  }

  @Get('categories')
  async getCategories(@Request() req, @Query() query: QueryCategoriesDto): Promise<CategoriesResponseDto> {
    const userId = req.user.id;
    const data = await this.statisticsService.getCategoryStats(userId, query.year, query.month);
    return { data };
  }

  @Get('trends')
  async getTrends(@Request() req, @Query() query: QueryTrendsDto): Promise<TrendsResponseDto> {
    const userId = req.user.id;
    return this.statisticsService.getTrendStats(userId, query.year, query.month);
  }

  @Get('best')
  async getBest(@Request() req, @Query() query: QueryBestDto): Promise<BestResponseDto> {
    const userId = req.user.id;
    const data = await this.statisticsService.getBestExperiences(userId, query.limit, query.year, query.month);
    return { data };
  }

  @Get('worst')
  async getWorst(@Request() req, @Query() query: QueryBestDto): Promise<BestResponseDto> {
    const userId = req.user.id;
    const data = await this.statisticsService.getWorstExperiences(userId, query.limit, query.year, query.month);
    return { data };
  }

  @Get('monthly')
  async getMonthly(@Request() req, @Query() query: QueryMonthlyDto): Promise<MonthlyResponseDto> {
    const userId = req.user.id;
    const data = await this.statisticsService.getMonthlyStats(userId, query.year);
    return {
      year: query.year,
      data,
    };
  }

  @Get('summary')
  async getSummary(@Request() req, @Query() query: QueryOverviewDto): Promise<SummaryResponseDto> {
    const userId = req.user.id;
    return this.statisticsService.getStatsSummary(userId, query.year, query.month);
  }
}
