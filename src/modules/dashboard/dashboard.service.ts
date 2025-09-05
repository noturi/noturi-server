import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics() {
    const [totalUsers, totalCategories, activeUsers] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'USER' },
      }),
      this.prisma.category.count(),
      this.prisma.user.count({
        where: {
          role: 'USER',
          updatedAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      }),
    ]);

    const lastMonthUsers = await this.prisma.user.count({
      where: {
        role: 'USER',
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 2)),
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const userGrowthRate = lastMonthUsers > 0 
      ? Math.round(((totalUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : 100;

    return {
      totalUsers,
      totalCategories,
      activeUsers,
      userGrowthRate,
    };
  }

  async getRecentActivities() {
    const recentUsers = await this.prisma.user.findMany({
      where: { role: 'USER' },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    const recentCategories = await this.prisma.category.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    const activities = [
      ...recentUsers.map(user => ({
        type: 'user_registration' as const,
        title: '새로운 사용자 등록',
        description: user.email,
        createdAt: user.createdAt,
      })),
      ...recentCategories.map(category => ({
        type: 'category_creation' as const,
        title: '카테고리 생성',
        description: `${category.name} (by ${category.user.nickname})`,
        createdAt: category.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return activities;
  }
}