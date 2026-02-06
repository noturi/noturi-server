import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCalendarMemoDto, QueryCalendarMemoDto, UpdateCalendarMemoDto } from './client/dto';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';

@Injectable()
export class CalendarMemosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 초/밀리초를 00으로 정규화 (08:32:20.768 → 08:32:00.000)
   */
  private normalizeDateTime(dateString: string): Date {
    const date = new Date(dateString);
    date.setSeconds(0, 0);
    return date;
  }

  async createCalendarMemo(userId: string, createCalendarMemoDto: CreateCalendarMemoDto) {
    const { title, startDate, endDate, isAllDay, hasNotification, notifyBefore } = createCalendarMemoDto;

    return this.prisma.calendarMemo.create({
      data: {
        title,
        startDate: this.normalizeDateTime(startDate),
        endDate: this.normalizeDateTime(endDate),
        isAllDay: isAllDay || false,
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
      throw new NotFoundException(ERROR_MESSAGES.CALENDAR_MEMO_NOT_FOUND);
    }

    return calendarMemo;
  }

  async updateCalendarMemo(userId: string, calendarMemoId: string, updateCalendarMemoDto: UpdateCalendarMemoDto) {
    await this.getCalendarMemoById(userId, calendarMemoId);

    const { title, startDate, endDate, isAllDay, hasNotification, notifyBefore } = updateCalendarMemoDto;

    return this.prisma.calendarMemo.update({
      where: { id: calendarMemoId },
      data: {
        ...(title !== undefined && { title }),
        ...(startDate !== undefined && { startDate: this.normalizeDateTime(startDate) }),
        ...(endDate !== undefined && { endDate: this.normalizeDateTime(endDate) }),
        ...(isAllDay !== undefined && { isAllDay }),
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
