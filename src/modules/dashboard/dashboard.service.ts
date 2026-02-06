import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRole } from '../../common/enums/permissions.enum';
import { ActivityType } from '../../common/enums/activity-type.enum';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalMemos, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.USER },
      }),
      this.prisma.memo.count(),
      // MAU: 최근 30일간 앱을 열어본 유저 수
      this.prisma.user.count({
        where: { role: UserRole.USER, lastActiveAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: { role: UserRole.USER, createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.user.count({
        where: { role: UserRole.USER, createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }),
    ]);

    // MoM 신규가입 증가율
    const userGrowthRate =
      newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0
          ? 100
          : 0;

    return {
      totalUsers,
      totalMemos,
      activeUsers,
      userGrowthRate,
    };
  }

  async getRecentActivities() {
    const userSelect = { select: { nickname: true } };

    const [recentUsers, recentMemos, recentCalendarMemos] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: UserRole.USER },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, nickname: true, createdAt: true },
      }),
      this.prisma.memo.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          user: userSelect,
          category: { select: { name: true } },
        },
      }),
      this.prisma.calendarMemo.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          user: userSelect,
        },
      }),
    ]);

    const activities = [
      ...recentUsers.map((user) => ({
        type: ActivityType.USER_REGISTRATION,
        title: '새로운 사용자 등록',
        description: user.email,
        createdAt: user.createdAt,
      })),
      ...recentMemos.map((memo) => {
        const isUpdate = memo.updatedAt.getTime() - memo.createdAt.getTime() > 1000;
        return {
          type: isUpdate ? ActivityType.MEMO_UPDATE : ActivityType.MEMO_CREATION,
          title: isUpdate ? '메모 수정' : '메모 작성',
          description: `${memo.title}${memo.category ? ` [${memo.category.name}]` : ''} (by ${memo.user.nickname})`,
          createdAt: memo.updatedAt,
        };
      }),
      ...recentCalendarMemos.map((cm) => {
        const isUpdate = cm.updatedAt.getTime() - cm.createdAt.getTime() > 1000;
        return {
          type: isUpdate ? ActivityType.CALENDAR_MEMO_UPDATE : ActivityType.CALENDAR_MEMO_CREATION,
          title: isUpdate ? '캘린더 메모 수정' : '캘린더 메모 작성',
          description: `${cm.title} (by ${cm.user.nickname})`,
          createdAt: cm.updatedAt,
        };
      }),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    return activities;
  }
}