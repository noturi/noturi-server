import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DailyStatsDto,
  MonthlyStatsResponseDto,
  WeeklyStatsResponseDto,
  DayOfWeekStatsDto,
  OverviewStatsResponseDto,
} from './client/dto';

@Injectable()
export class TodosStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 월별 일간 달성률 (캘린더용)
   */
  async getMonthlyStats(userId: string, year?: number, month?: number): Promise<MonthlyStatsResponseDto> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // 해당 월의 모든 투두 조회
    const todos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        isCompleted: true,
      },
    });

    // 날짜별로 그룹화
    const dateMap = new Map<string, { total: number; completed: number }>();

    todos.forEach((todo) => {
      const dateKey = this.formatDate(todo.date);
      const existing = dateMap.get(dateKey) || { total: 0, completed: 0 };
      existing.total++;
      if (todo.isCompleted) {
        existing.completed++;
      }
      dateMap.set(dateKey, existing);
    });

    // 응답 변환
    const dailyStats: DailyStatsDto[] = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    // 날짜순 정렬
    dailyStats.sort((a, b) => a.date.localeCompare(b.date));

    return {
      year: targetYear,
      month: targetMonth,
      dailyStats,
    };
  }

  /**
   * 주간 통계 (이번 주 달성률, 요일별)
   */
  async getWeeklyStats(userId: string): Promise<WeeklyStatsResponseDto> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 이번 주 일요일 찾기
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);

    // 이번 주 토요일
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // 이번 주 모든 투두 조회
    const todos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      select: {
        date: true,
        isCompleted: true,
      },
    });

    // 요일별로 그룹화
    const dayMap = new Map<number, { total: number; completed: number }>();
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, { total: 0, completed: 0 });
    }

    let totalCount = 0;
    let completedCount = 0;

    todos.forEach((todo) => {
      const day = todo.date.getDay();
      const existing = dayMap.get(day)!;
      existing.total++;
      totalCount++;
      if (todo.isCompleted) {
        existing.completed++;
        completedCount++;
      }
    });

    // 요일별 응답 변환
    const dailyBreakdown: DayOfWeekStatsDto[] = Array.from(dayMap.entries()).map(([dayOfWeek, stats]) => ({
      dayOfWeek,
      total: stats.total,
      completed: stats.completed,
      rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }));

    return {
      weekStart: this.formatDate(weekStart),
      weekEnd: this.formatDate(weekEnd),
      total: totalCount,
      completed: completedCount,
      rate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      dailyBreakdown,
    };
  }

  /**
   * 전체 통계 개요 + 연속 달성일(streak)
   */
  async getOverviewStats(userId: string): Promise<OverviewStatsResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalTodos: true,
        completedTodos: true,
        currentStreak: true,
        bestStreak: true,
      },
    });

    if (!user) {
      return {
        totalTodos: 0,
        completedTodos: 0,
        overallRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      };
    }

    return {
      totalTodos: user.totalTodos,
      completedTodos: user.completedTodos,
      overallRate: user.totalTodos > 0 ? Math.round((user.completedTodos / user.totalTodos) * 100) : 0,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
    };
  }

  /**
   * 연속 달성일 업데이트 (매일 자정 또는 투두 완료 시 호출)
   */
  async updateStreak(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 최근 30일간 날짜별 달성률 확인
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const todos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
      select: {
        date: true,
        isCompleted: true,
      },
    });

    // 날짜별 그룹화
    const dateMap = new Map<string, { total: number; completed: number }>();
    todos.forEach((todo) => {
      const dateKey = this.formatDate(todo.date);
      const existing = dateMap.get(dateKey) || { total: 0, completed: 0 };
      existing.total++;
      if (todo.isCompleted) {
        existing.completed++;
      }
      dateMap.set(dateKey, existing);
    });

    // 오늘부터 과거로 연속 달성일 계산
    let currentStreak = 0;
    const checkDate = new Date(today);

    while (true) {
      const dateKey = this.formatDate(checkDate);
      const stats = dateMap.get(dateKey);

      // 해당 날짜에 투두가 없으면 스킵하고 계속
      if (!stats || stats.total === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        // 30일 전까지만 확인
        if (checkDate < thirtyDaysAgo) {
          break;
        }
        continue;
      }

      // 100% 달성했으면 streak 증가
      if (stats.completed === stats.total) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // 100% 미달성이면 streak 종료
        break;
      }
    }

    // 현재 streak과 best streak 업데이트
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bestStreak: true },
    });

    const bestStreak = Math.max(currentStreak, user?.bestStreak || 0);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        bestStreak,
      },
    });
  }
}
