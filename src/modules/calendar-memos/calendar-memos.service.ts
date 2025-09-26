import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  CreateCalendarMemoDto, 
  QueryCalendarMemoDto, 
  UpdateCalendarMemoDto 
} from './client/dto';

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
    const { keyword, startDate, endDate, hasNotification, page = '1', limit = '20' } = queryDto;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = {
      userId,
      ...(hasNotification !== undefined && { hasNotification }),
      ...(keyword && {
        title: { contains: keyword, mode: 'insensitive' },
      }),
    };

    // 날짜 범위 필터링
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    const [calendarMemos, total] = await Promise.all([
      this.prisma.calendarMemo.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.calendarMemo.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: calendarMemos,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
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

  // 특정 날짜 범위의 일정 조회 (캘린더 뷰용)
  async getCalendarMemosByDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.calendarMemo.findMany({
      where: {
        userId,
        OR: [
          // 시작 날짜가 범위 내에 있음
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // 끝 날짜가 범위 내에 있음
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // 일정이 범위를 완전히 포함함
          {
            startDate: {
              lte: startDate,
            },
            endDate: {
              gte: endDate,
            },
          },
        ],
      },
      orderBy: { startDate: 'asc' },
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