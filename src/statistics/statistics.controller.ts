// src/statistics/statistics.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
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
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  // GET /statistics/overview?year=2025&month=7
  @Get('overview')
  async getOverview(@Query() query: QueryOverviewDto): Promise<OverviewResponseDto> {
    const userId = this.getCurrentUserId();
    return this.statisticsService.getOverviewStats(userId, query.year, query.month);
  }

  // GET /statistics/categories?year=2025
  @Get('categories')
  async getCategories(@Query() query: QueryCategoriesDto): Promise<CategoriesResponseDto> {
    const userId = this.getCurrentUserId();
    const data = await this.statisticsService.getCategoryStats(userId, query.year, query.month);
    return { data };
  }

  // GET /statistics/trends?year=2025&month=7
  @Get('trends')
  async getTrends(@Query() query: QueryTrendsDto): Promise<TrendsResponseDto> {
    const userId = this.getCurrentUserId();
    return this.statisticsService.getTrendStats(userId, query.year, query.month);
  }

  // GET /statistics/best?limit=5&year=2025
  @Get('best')
  async getBest(@Query() query: QueryBestDto): Promise<BestResponseDto> {
    const userId = this.getCurrentUserId();
    const data = await this.statisticsService.getBestExperiences(userId, query.limit, query.year, query.month);
    return { data };
  }

  // GET /statistics/worst?limit=5&year=2025
  @Get('worst')
  async getWorst(@Query() query: QueryBestDto): Promise<BestResponseDto> {
    const userId = this.getCurrentUserId();
    const data = await this.statisticsService.getWorstExperiences(userId, query.limit, query.year, query.month);
    return { data };
  }

  // GET /statistics/monthly?year=2025
  @Get('monthly')
  async getMonthly(@Query() query: QueryMonthlyDto): Promise<MonthlyResponseDto> {
    const userId = this.getCurrentUserId();
    const data = await this.statisticsService.getMonthlyStats(userId, query.year);
    return {
      year: query.year,
      data,
    };
  }

  // GET /statistics/summary?year=2025&month=7
  @Get('summary')
  async getSummary(@Query() query: QueryOverviewDto): Promise<SummaryResponseDto> {
    const userId = this.getCurrentUserId();
    return this.statisticsService.getStatsSummary(userId, query.year, query.month);
  }

  // 임시 사용자 ID (나중에 Auth에서 실제 사용자 ID로 교체)
  private getCurrentUserId(): string {
    return 'temp-user-id';
  }
}
