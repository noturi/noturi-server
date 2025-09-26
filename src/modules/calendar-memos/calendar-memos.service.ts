import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCalendarMemoDto, QueryCalendarMemoDto, UpdateCalendarMemoDto } from './client/dto';

@Injectable()
export class CalendarMemosService {
  constructor(private readonly prisma: PrismaService) {}

  async createCalendarMemo(userId: string, createCalendarMemoDto: CreateCalendarMemoDto) {
    const { title, startDate, endDate, hasNotification, notifyBefore } = createCalendarMemoDto;

    return this.prisma.calendarMemo.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        hasNotification: hasNotification || false,
        notifyBefore,
        userId,
      },
    });
  }

  async getCalendarMemos(userId: string, queryDto: QueryCalendarMemoDto) {
    const { keyword, year, month, hasNotification } = queryDto;

    // 기본값: 현재 년월
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // 해당 월의 시작일과 마지막일 계산
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const where: any = {
      userId,
      ...(hasNotification !== undefined && { hasNotification }),
      ...(keyword && {
        title: { contains: keyword, mode: 'insensitive' },
      }),
      OR: [
        // 시작 날짜가 해당 월에 있음
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // 끝 날짜가 해당 월에 있음
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // 일정이 해당 월을 완전히 포함함
        {
          startDate: {
            lt: startDate,
          },
          endDate: {
            gt: endDate,
          },
        },
      ],
    };

    const calendarMemos = await this.prisma.calendarMemo.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return {
      year: targetYear,
      month: targetMonth,
      data: calendarMemos,
      total: calendarMemos.length,
    };
  }

  async getCalendarMemoById(userId: string, calendarMemoId: string) {
    const calendarMemo = await this.prisma.calendarMemo.findFirst({
      where: { id: calendarMemoId, userId },
    });

    if (!calendarMemo) {
      throw new NotFoundException('일정을 찾을 수 없습니다');
    }

    return calendarMemo;
  }

  async updateCalendarMemo(userId: string, calendarMemoId: string, updateCalendarMemoDto: UpdateCalendarMemoDto) {
    await this.getCalendarMemoById(userId, calendarMemoId);

    const { title, startDate, endDate, hasNotification, notifyBefore } = updateCalendarMemoDto;

    return this.prisma.calendarMemo.update({
      where: { id: calendarMemoId },
      data: {
        ...(title !== undefined && { title }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(hasNotification !== undefined && { hasNotification }),
        ...(notifyBefore !== undefined && { notifyBefore }),
      },
    });
  }

  async deleteCalendarMemo(userId: string, calendarMemoId: string) {
    const calendarMemo = await this.getCalendarMemoById(userId, calendarMemoId);

    await this.prisma.calendarMemo.delete({
      where: { id: calendarMemo.id },
    });
  }

  // 알림 설정된 일정들 조회 (클라이언트에서 로컬 알림 설정용)
  async getNotificationEnabledCalendarMemos(userId: string) {
    return this.prisma.calendarMemo.findMany({
      where: {
        userId,
        hasNotification: true,
        startDate: {
          gte: new Date(), // 현재 시간 이후 일정만
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
