import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryStatisticsDto, StatisticsPeriod, TrendsParamsDto } from './client/dto';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStatistics(userId: string, queryDto: QueryStatisticsDto) {
    const { startDate, endDate, period } = queryDto;

    // 날짜 범위 설정 (기본값: 최근 1년)
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    // 전체 메모 개수
    const totalMemos = await this.prisma.memo.count({
      where: { userId },
    });

    // 전체 카테고리 개수
    const totalCategories = await this.prisma.category.count({
      where: { userId },
    });

    // 이번 달과 지난 달 메모 개수
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthMemos, lastMonthMemos] = await Promise.all([
      this.prisma.memo.count({
        where: {
          userId,
          createdAt: {
            gte: thisMonthStart,
          },
        },
      }),
      this.prisma.memo.count({
        where: {
          userId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // 증감률 계산
    const growthRate =
      lastMonthMemos > 0 ? ((thisMonthMemos - lastMonthMemos) / lastMonthMemos) * 100 : thisMonthMemos > 0 ? 100 : 0;

    // 카테고리별 통계
    const categoryStats = await this.prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            memos: true,
          },
        },
      },
      orderBy: {
        memos: {
          _count: 'desc',
        },
      },
    });

    const categoryStatsWithPercentage = categoryStats.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      count: category._count.memos,
      percentage: totalMemos > 0 ? (category._count.memos / totalMemos) * 100 : 0,
    }));

    // 기간별 통계
    const periodStats = await this.getPeriodStatistics(userId, start, end, period || StatisticsPeriod.MONTHLY);

    // 가장 최근 메모 작성일
    const lastMemo = await this.prisma.memo.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // 일일 평균 메모 작성 개수
    const daysDiff = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const averageMemosPerDay = daysDiff > 0 ? totalMemos / daysDiff : 0;

    return {
      totalMemos,
      totalCategories,
      thisMonthMemos,
      lastMonthMemos,
      growthRate: Math.round(growthRate * 100) / 100,
      categoryStats: categoryStatsWithPercentage,
      periodStats,
      lastMemoDate: lastMemo?.createdAt.toISOString().split('T')[0],
      averageMemosPerDay: Math.round(averageMemosPerDay * 100) / 100,
    };
  }

  private async getPeriodStatistics(userId: string, startDate: Date, endDate: Date, period: StatisticsPeriod) {
    const memos = await this.prisma.memo.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 날짜별로 그룹핑
    const groupedMemos = memos.reduce(
      (acc, memo) => {
        const periodKey = this.formatDateByPeriod(memo.createdAt, period);
        acc[periodKey] = (acc[periodKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 결과 배열로 변환
    return Object.entries(groupedMemos).map(([period, count]) => ({
      period,
      count,
    }));
  }

  private getDateFormat(period: StatisticsPeriod): string {
    switch (period) {
      case StatisticsPeriod.DAILY:
        return 'YYYY-MM-DD';
      case StatisticsPeriod.WEEKLY:
        return 'YYYY-WW';
      case StatisticsPeriod.MONTHLY:
        return 'YYYY-MM';
      case StatisticsPeriod.YEARLY:
        return 'YYYY';
      default:
        return 'YYYY-MM';
    }
  }

  private formatDateByPeriod(date: Date, period: StatisticsPeriod): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
      case StatisticsPeriod.DAILY:
        return `${year}-${month}-${day}`;
      case StatisticsPeriod.WEEKLY:
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case StatisticsPeriod.MONTHLY:
        return `${year}-${month}`;
      case StatisticsPeriod.YEARLY:
        return `${year}`;
      default:
        return `${year}-${month}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // 트렌드 분석 API
  async getTrends(userId: string, params: TrendsParamsDto) {
    const now = new Date();
    const year = params.year || now.getFullYear();
    const month = params.month;

    let startDate: Date;
    let endDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    if (month) {
      // 특정 월 조회
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
      previousStartDate = new Date(year, month - 2, 1);
      previousEndDate = new Date(year, month - 1, 0, 23, 59, 59);
    } else {
      // 전체 연도 조회
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      previousStartDate = new Date(year - 1, 0, 1);
      previousEndDate = new Date(year - 1, 11, 31, 23, 59, 59);
    }

    // 해당 기간 메모 데이터 (필요한 필드만 조회)
    const memos = await this.prisma.memo.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { createdAt: true, rating: true },
      orderBy: { createdAt: 'asc' },
    });

    // 이전 기간 메모 개수 (증감률 계산용)
    const previousMemos = await this.prisma.memo.count({
      where: {
        userId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });

    // 일별로 그룹핑
    const dailyData = memos.reduce(
      (acc, memo) => {
        const date = memo.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, totalRating: 0, ratingCount: 0 };
        }
        acc[date].count++;
        if (memo.rating !== null) {
          acc[date].totalRating += Number(memo.rating);
          acc[date].ratingCount++;
        }
        return acc;
      },
      {} as Record<string, { count: number; totalRating: number; ratingCount: number }>,
    );

    // 트렌드 데이터 생성
    const trends = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      averageRating: data.ratingCount > 0 ? Math.round((data.totalRating / data.ratingCount) * 10) / 10 : 0,
    }));

    const totalMemos = memos.length;
    const memosWithRating = memos.filter((memo) => memo.rating !== null);
    const averageRating =
      memosWithRating.length > 0
        ? Math.round(
            (memosWithRating.reduce((sum, memo) => sum + Number(memo.rating), 0) / memosWithRating.length) * 10,
          ) / 10
        : 0;

    const growthRate =
      previousMemos > 0
        ? Math.round(((totalMemos - previousMemos) / previousMemos) * 1000) / 10
        : totalMemos > 0
          ? 100
          : 0;

    return {
      trends,
      totalMemos,
      averageRating,
      growthRate,
    };
  }

  // 전체 통계 개요 API
  async getOverallStats(userId: string) {
    const now = new Date();

    // 전체 메모 개수
    const totalMemos = await this.prisma.memo.count({
      where: { userId },
    });

    // 전체 카테고리 개수
    const totalCategories = await this.prisma.category.count({
      where: { userId },
    });

    // 이번 달과 지난 달 메모 개수
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthMemos, lastMonthMemos] = await Promise.all([
      this.prisma.memo.count({
        where: {
          userId,
          createdAt: { gte: thisMonthStart },
        },
      }),
      this.prisma.memo.count({
        where: {
          userId,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
    ]);

    // 전체 평균 평점
    const avgRatingResult = await this.prisma.memo.aggregate({
      where: { userId },
      _avg: { rating: true },
    });
    const averageRating = avgRatingResult._avg.rating ? Math.round(Number(avgRatingResult._avg.rating) * 10) / 10 : 0;

    // 첫 메모, 마지막 메모 날짜 병렬 조회
    const [firstMemo, lastMemo] = await Promise.all([
      this.prisma.memo.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.memo.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    const daysSinceFirst = firstMemo
      ? Math.ceil((now.getTime() - firstMemo.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const dailyAverage = Math.round((totalMemos / daysSinceFirst) * 10) / 10;

    // 이번 달 활동 일수
    const activeDaysResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT DATE("createdAt")) as count FROM memos
      WHERE "userId" = ${userId} AND "createdAt" >= ${thisMonthStart}
    `;

    const growthRate =
      lastMonthMemos > 0
        ? Math.round(((thisMonthMemos - lastMonthMemos) / lastMonthMemos) * 1000) / 10
        : thisMonthMemos > 0
          ? 100
          : 0;

    return {
      totalMemos,
      totalCategories,
      thisMonthMemos,
      lastMonthMemos,
      growthRate,
      averageRating,
      dailyAverage,
      lastMemoDate: lastMemo?.createdAt.toISOString().split('T')[0],
      activeDaysThisMonth: Number(activeDaysResult[0].count),
    };
  }

  // 카테고리별 통계 API
  async getCategoryStats(userId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 카테고리별 전체 개수, 마지막 메모 날짜만 조회 (N+1 방지)
    const [categories, totalMemos, thisMonthCounts, avgRatings] = await Promise.all([
      this.prisma.category.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          color: true,
          _count: { select: { memos: true } },
          memos: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.memo.count({ where: { userId } }),
      // 이번 달 메모 카운트를 groupBy로 한 번에 조회
      this.prisma.memo.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          createdAt: { gte: thisMonthStart },
        },
        _count: true,
      }),
      // 카테고리별 평균 평점 조회
      this.prisma.memo.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
    ]);

    const thisMonthMap = new Map(thisMonthCounts.map((c) => [c.categoryId, c._count]));
    const avgRatingMap = new Map(avgRatings.map((r) => [r.categoryId, Number(r._avg.rating) || 0]));

    return categories.map((category) => {
      const count = category._count.memos;
      const lastMemo = category.memos[0];
      const avgRating = avgRatingMap.get(category.id) || 0;

      return {
        id: category.id,
        name: category.name,
        color: category.color || '#000000',
        count,
        percentage: totalMemos > 0 ? Math.round((count / totalMemos) * 1000) / 10 : 0,
        averageRating: Math.round(avgRating * 10) / 10,
        lastMemoDate: lastMemo?.createdAt.toISOString().split('T')[0],
        thisMonthCount: thisMonthMap.get(category.id) || 0,
      };
    });
  }
}
