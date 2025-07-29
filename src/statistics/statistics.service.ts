// src/statistics/statistics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // 전체 통계 (개요 탭용)
  async getOverviewStats(userId: string, year?: number, month?: number) {
    const whereClause: any = { userId };

    // 기간 필터링
    if (year || month) {
      whereClause.createdAt = {};
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      }
    }

    const [totalMemos, avgRatingResult, bestCount, recommendedCount, avoidCount, totalCategories] = await Promise.all([
      this.prisma.memo.count({ where: whereClause }),
      this.prisma.memo.aggregate({
        where: whereClause,
        _avg: { rating: true },
      }),
      this.prisma.memo.count({
        where: { ...whereClause, rating: { gte: 4.5 } },
      }),
      this.prisma.memo.count({
        where: { ...whereClause, rating: { gte: 4.0 } },
      }),
      this.prisma.memo.count({
        where: { ...whereClause, rating: { lte: 2.5 } },
      }),
      this.prisma.category.count({ where: { userId } }),
    ]);

    return {
      totalMemos,
      avgRating: Number((avgRatingResult._avg.rating || 0).toFixed(1)),
      totalCategories,
      bestExperiences: bestCount,
      recommendedExperiences: recommendedCount,
      avoidExperiences: avoidCount,
    };
  }

  // 카테고리별 통계
  async getCategoryStats(userId: string, year?: number, month?: number) {
    const whereClause: any = { userId };

    // 기간 필터링
    if (year || month) {
      whereClause.createdAt = {};
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      }
    }

    const categoryStats = await this.prisma.memo.groupBy({
      by: ['categoryId'],
      where: whereClause,
      _count: { id: true },
      _avg: { rating: true },
    });

    const result = await Promise.all(
      categoryStats.map(async (stat) => {
        const [category, bestCount, worstCount, recentMemo] = await Promise.all([
          this.prisma.category.findUnique({
            where: { id: stat.categoryId },
            select: { id: true, name: true, color: true },
          }),
          this.prisma.memo.count({
            where: { ...whereClause, categoryId: stat.categoryId, rating: { gte: 4.5 } },
          }),
          this.prisma.memo.count({
            where: { ...whereClause, categoryId: stat.categoryId, rating: { lte: 2.5 } },
          }),
          this.prisma.memo.findFirst({
            where: { ...whereClause, categoryId: stat.categoryId },
            select: { id: true, title: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        const avgRating = Number((stat._avg.rating || 0).toFixed(1));

        // 평가 패턴 분석
        let pattern: string;
        if (avgRating >= 4.5) pattern = '항상 만족';
        else if (avgRating >= 3.5) pattern = '대체로 만족';
        else if (avgRating >= 2.5) pattern = '보통';
        else pattern = '까다로움';

        return {
          categoryId: stat.categoryId,
          categoryName: category?.name || 'Unknown',
          color: category?.color,
          count: stat._count.id,
          avgRating,
          pattern,
          bestCount,
          worstCount,
          recentMemo,
        };
      }),
    );

    return result.filter((stat) => stat.count > 0);
  }

  // 트렌드 분석 (별점 분포 + 평가 패턴)
  async getTrendStats(userId: string, year?: number, month?: number) {
    const whereClause: any = { userId };

    if (year || month) {
      whereClause.createdAt = {};
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      }
    }

    const [ratingStats, totalMemos, categoryStats] = await Promise.all([
      this.prisma.memo.groupBy({
        by: ['rating'],
        where: whereClause,
        _count: { id: true },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.memo.count({ where: whereClause }),
      this.getCategoryStats(userId, year, month),
    ]);

    // 별점 분포
    const ratingDistribution = ratingStats.map((stat) => ({
      rating: Number(stat.rating),
      count: stat._count.id,
      percentage: totalMemos > 0 ? Number(((stat._count.id / totalMemos) * 100).toFixed(1)) : 0,
    }));

    return {
      ratingDistribution,
      categoryPatterns: categoryStats.map((cat) => ({
        category: cat.categoryName,
        avgRating: cat.avgRating,
        pattern: cat.pattern,
      })),
    };
  }

  // 베스트 경험들
  async getBestExperiences(userId: string, limit: number = 10, year?: number, month?: number) {
    const whereClause: any = {
      userId,
      rating: { gte: 4.5 },
    };

    if (year || month) {
      whereClause.createdAt = {};
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      }
    }

    const memos = await this.prisma.memo.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        rating: true,
        createdAt: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return memos.map((memo) => ({
      id: memo.id,
      title: memo.title || '제목 없음',
      category: memo.category.name,
      rating: Number(memo.rating),
      date: memo.createdAt.toISOString().split('T')[0],
    }));
  }

  // 비추천 경험들
  async getWorstExperiences(userId: string, limit: number = 5, year?: number, month?: number) {
    const whereClause: any = {
      userId,
      rating: { lte: 2.5 },
    };

    if (year || month) {
      whereClause.createdAt = {};
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      } else if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        whereClause.createdAt.gte = startDate;
        whereClause.createdAt.lte = endDate;
      }
    }

    const memos = await this.prisma.memo.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        rating: true,
        createdAt: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: [{ rating: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return memos.map((memo) => ({
      id: memo.id,
      title: memo.title || '제목 없음',
      category: memo.category.name,
      rating: Number(memo.rating),
      date: memo.createdAt.toISOString().split('T')[0],
    }));
  }

  // 월별 통계 (연도별 보기용)
  async getMonthlyStats(userId: string, year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const monthlyStats = await Promise.all(
      months.map(async (month) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const [memos, avgRatingResult, bestCount] = await Promise.all([
          this.prisma.memo.count({
            where: {
              userId,
              createdAt: { gte: startDate, lte: endDate },
            },
          }),
          this.prisma.memo.aggregate({
            where: {
              userId,
              createdAt: { gte: startDate, lte: endDate },
            },
            _avg: { rating: true },
          }),
          this.prisma.memo.count({
            where: {
              userId,
              createdAt: { gte: startDate, lte: endDate },
              rating: { gte: 4.5 },
            },
          }),
        ]);

        return {
          month,
          count: memos,
          avgRating: Number((avgRatingResult._avg.rating || 0).toFixed(1)),
          bestCount,
        };
      }),
    );

    return monthlyStats.filter((stat) => stat.count > 0);
  }

  // 통계 요약 (공유용)
  async getStatsSummary(userId: string, year?: number, month?: number) {
    const [overview, categories, best] = await Promise.all([
      this.getOverviewStats(userId, year, month),
      this.getCategoryStats(userId, year, month),
      this.getBestExperiences(userId, 3, year, month),
    ]);

    const period = year && month ? `${year}년 ${month}월` : year ? `${year}년` : '전체';

    return {
      period,
      overview,
      topCategories: categories.slice(0, 3),
      bestExperiences: best,
    };
  }
}
