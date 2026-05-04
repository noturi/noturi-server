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

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth, weeklyMemoUsers, weeklyTodoUsers] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: UserRole.USER },
        }),
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
        // 이번 주 메모 작성 유저 수
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(DISTINCT "userId") as count FROM memos WHERE "createdAt" >= ${weekStart}
        `.then((rows) => Number(rows[0].count)),
        // 이번 주 투두 작성 유저 수
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(DISTINCT "userId") as count FROM todo_instances
          WHERE "createdAt" >= ${weekStart} AND "carryOverCount" = 0
        `.then((rows) => Number(rows[0].count)),
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
      activeUsers,
      userGrowthRate,
      weeklyMemoUsers,
      weeklyTodoUsers,
    };
  }

  async getRecentActivities() {
    const userSelect = { select: { nickname: true } };

    const [recentUsers, recentMemos, recentTodoInstances] = await Promise.all([
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
      this.prisma.todoInstance.findMany({
        where: { carryOverCount: 0 },
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
      ...recentTodoInstances.map((todo) => {
        const isUpdate = todo.updatedAt.getTime() - todo.createdAt.getTime() > 1000;
        return {
          type: isUpdate ? ActivityType.TODO_UPDATE : ActivityType.TODO_CREATION,
          title: isUpdate ? '투두 수정' : '투두 작성',
          description: `${todo.title} (by ${todo.user.nickname})`,
          createdAt: todo.updatedAt,
        };
      }),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    return activities;
  }
}