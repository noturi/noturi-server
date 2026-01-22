import { ApiProperty } from '@nestjs/swagger';

export class DailyStatsDto {
  @ApiProperty({ example: '2026-01-22', description: '날짜' })
  date: string;

  @ApiProperty({ example: 3, description: '전체 투두 수' })
  total: number;

  @ApiProperty({ example: 1, description: '완료한 투두 수' })
  completed: number;

  @ApiProperty({ example: 33, description: '달성률 (%)' })
  rate: number;
}

export class MonthlyStatsResponseDto {
  @ApiProperty({ example: 2026, description: '년도' })
  year: number;

  @ApiProperty({ example: 1, description: '월' })
  month: number;

  @ApiProperty({ type: [DailyStatsDto], description: '일별 달성률 목록' })
  dailyStats: DailyStatsDto[];
}

export class DayOfWeekStatsDto {
  @ApiProperty({ example: 0, description: '요일 (0=일요일 ~ 6=토요일)' })
  dayOfWeek: number;

  @ApiProperty({ example: 3, description: '전체 투두 수' })
  total: number;

  @ApiProperty({ example: 3, description: '완료한 투두 수' })
  completed: number;

  @ApiProperty({ example: 100, description: '달성률 (%)' })
  rate: number;
}

export class WeeklyStatsResponseDto {
  @ApiProperty({ example: '2026-01-20', description: '주 시작일' })
  weekStart: string;

  @ApiProperty({ example: '2026-01-26', description: '주 종료일' })
  weekEnd: string;

  @ApiProperty({ example: 21, description: '전체 투두 수' })
  total: number;

  @ApiProperty({ example: 15, description: '완료한 투두 수' })
  completed: number;

  @ApiProperty({ example: 71, description: '주간 달성률 (%)' })
  rate: number;

  @ApiProperty({ type: [DayOfWeekStatsDto], description: '요일별 달성률' })
  dailyBreakdown: DayOfWeekStatsDto[];
}

export class OverviewStatsResponseDto {
  @ApiProperty({ example: 150, description: '전체 투두 수' })
  totalTodos: number;

  @ApiProperty({ example: 120, description: '완료한 투두 수' })
  completedTodos: number;

  @ApiProperty({ example: 80, description: '전체 달성률 (%)' })
  overallRate: number;

  @ApiProperty({ example: 5, description: '현재 연속 달성일' })
  currentStreak: number;

  @ApiProperty({ example: 14, description: '최고 연속 달성일' })
  bestStreak: number;
}
