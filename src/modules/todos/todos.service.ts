import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto, UpdateTemplateDto, QueryTodoDto } from './client/dto';
import { RecurrenceType } from './enums/recurrence-type.enum';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 날짜를 00:00:00.000으로 정규화
   */
  private normalizeDate(dateString: string): Date {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 특정 날짜가 반복 규칙에 해당하는지 확인
   */
  private isDateMatchingRecurrence(
    date: Date,
    recurrenceType: RecurrenceType,
    recurrenceDays: number[],
  ): boolean {
    if (recurrenceType === RecurrenceType.DAILY) {
      return true;
    }

    if (recurrenceType === RecurrenceType.WEEKLY) {
      const dayOfWeek = date.getDay(); // 0 = 일요일
      return recurrenceDays.includes(dayOfWeek);
    }

    if (recurrenceType === RecurrenceType.MONTHLY) {
      const dayOfMonth = date.getDate(); // 1~31
      return recurrenceDays.includes(dayOfMonth);
    }

    return false;
  }

  /**
   * 투두 생성 (일회성 또는 반복)
   */
  async createTodo(userId: string, createTodoDto: CreateTodoDto) {
    const { title, description, date, recurrenceType, recurrenceDays, endDate } = createTodoDto;
    const normalizedDate = this.normalizeDate(date);

    // 일회성 투두
    if (!recurrenceType || recurrenceType === RecurrenceType.NONE) {
      const instance = await this.prisma.todoInstance.create({
        data: {
          title,
          description,
          date: normalizedDate,
          userId,
        },
      });

      // 통계 업데이트
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalTodos: { increment: 1 } },
      });

      return instance;
    }

    // 반복 투두: 먼저 템플릿 생성
    if (recurrenceType === RecurrenceType.WEEKLY && (!recurrenceDays || recurrenceDays.length === 0)) {
      throw new BadRequestException('주간 반복의 경우 요일을 선택해야 합니다');
    }
    if (recurrenceType === RecurrenceType.MONTHLY && (!recurrenceDays || recurrenceDays.length === 0)) {
      throw new BadRequestException('월간 반복의 경우 날짜를 선택해야 합니다');
    }

    const template = await this.prisma.todoTemplate.create({
      data: {
        title,
        description,
        recurrenceType,
        recurrenceDays: recurrenceDays || [],
        startDate: normalizedDate,
        endDate: endDate ? this.normalizeDate(endDate) : null,
        userId,
      },
    });

    // 7일치 인스턴스 미리 생성
    const instances = await this.generateInstances(template.id, userId, 7);

    return {
      template,
      instances,
    };
  }

  /**
   * 템플릿에서 인스턴스 생성 (daysAhead 일 수만큼)
   */
  async generateInstances(templateId: string, userId: string, daysAhead: number) {
    const template = await this.prisma.todoTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return [];
    }

    const instances: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysAhead; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);

      // 시작일 이전이면 스킵
      if (targetDate < template.startDate) {
        continue;
      }

      // 종료일 이후면 스킵
      if (template.endDate && targetDate > template.endDate) {
        continue;
      }

      // 반복 규칙에 맞는지 확인
      if (!this.isDateMatchingRecurrence(
        targetDate,
        template.recurrenceType as RecurrenceType,
        template.recurrenceDays,
      )) {
        continue;
      }

      // 이미 존재하는지 확인
      const existing = await this.prisma.todoInstance.findUnique({
        where: {
          templateId_date: {
            templateId,
            date: targetDate,
          },
        },
      });

      if (existing) {
        continue;
      }

      // 인스턴스 생성
      const instance = await this.prisma.todoInstance.create({
        data: {
          title: template.title,
          description: template.description,
          date: targetDate,
          templateId,
          userId,
        },
      });

      // 통계 업데이트
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalTodos: { increment: 1 } },
      });

      instances.push(instance);
    }

    return instances;
  }

  /**
   * 투두 조회 (날짜별 또는 월별)
   */
  async getTodos(userId: string, queryDto: QueryTodoDto) {
    const { date, year, month } = queryDto;

    // 특정 날짜 조회
    if (date) {
      const normalizedDate = this.normalizeDate(date);
      const nextDay = new Date(normalizedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const todos = await this.prisma.todoInstance.findMany({
        where: {
          userId,
          OR: [
            // 해당 날짜의 투두
            { date: { gte: normalizedDate, lt: nextDay } },
            // 과거 미완료 투두 (이월)
            { date: { lt: normalizedDate }, isCompleted: false },
          ],
        },
        orderBy: [{ isCompleted: 'asc' }, { date: 'asc' }, { createdAt: 'asc' }],
      });

      const completed = todos.filter((t) => t.isCompleted).length;

      return {
        date,
        year: null,
        month: null,
        data: todos,
        total: todos.length,
        completed,
        rate: todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0,
      };
    }

    // 월별 조회
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const todos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { isCompleted: 'asc' }, { createdAt: 'asc' }],
    });

    const completed = todos.filter((t) => t.isCompleted).length;

    return {
      date: null,
      year: targetYear,
      month: targetMonth,
      data: todos,
      total: todos.length,
      completed,
      rate: todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0,
    };
  }

  /**
   * 투두 상세 조회
   */
  async getTodoById(userId: string, todoId: string) {
    const todo = await this.prisma.todoInstance.findFirst({
      where: { id: todoId, userId },
    });

    if (!todo) {
      throw new NotFoundException('투두를 찾을 수 없습니다');
    }

    return todo;
  }

  /**
   * 투두 수정
   */
  async updateTodo(userId: string, todoId: string, updateTodoDto: UpdateTodoDto) {
    const todo = await this.getTodoById(userId, todoId);

    const { title, description, isCompleted } = updateTodoDto;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    // 완료 상태 변경 처리
    if (isCompleted !== undefined && isCompleted !== todo.isCompleted) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;

      // 통계 업데이트
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          completedTodos: isCompleted ? { increment: 1 } : { decrement: 1 },
        },
      });
    }

    return this.prisma.todoInstance.update({
      where: { id: todoId },
      data: updateData,
    });
  }

  /**
   * 투두 삭제
   */
  async deleteTodo(userId: string, todoId: string) {
    const todo = await this.getTodoById(userId, todoId);

    await this.prisma.todoInstance.delete({
      where: { id: todoId },
    });

    // 통계 업데이트
    const updateData: any = { totalTodos: { decrement: 1 } };
    if (todo.isCompleted) {
      updateData.completedTodos = { decrement: 1 };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  /**
   * 완료 토글
   */
  async toggleTodo(userId: string, todoId: string) {
    const todo = await this.getTodoById(userId, todoId);

    const newIsCompleted = !todo.isCompleted;

    const updated = await this.prisma.todoInstance.update({
      where: { id: todoId },
      data: {
        isCompleted: newIsCompleted,
        completedAt: newIsCompleted ? new Date() : null,
      },
    });

    // 통계 업데이트
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        completedTodos: newIsCompleted ? { increment: 1 } : { decrement: 1 },
      },
    });

    // 해당 날짜의 달성률 계산
    const dateStart = new Date(todo.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const dailyTodos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: { gte: dateStart, lt: dateEnd },
      },
      select: { isCompleted: true },
    });

    const total = dailyTodos.length;
    const completed = dailyTodos.filter((t) => t.isCompleted).length;

    return {
      ...updated,
      dailyStats: {
        total,
        completed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    };
  }

  /**
   * 반복 템플릿 목록 조회
   */
  async getTemplates(userId: string) {
    const templates = await this.prisma.todoTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: templates,
      total: templates.length,
    };
  }

  /**
   * 템플릿 상세 조회
   */
  async getTemplateById(userId: string, templateId: string) {
    const template = await this.prisma.todoTemplate.findFirst({
      where: { id: templateId, userId },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다');
    }

    return template;
  }

  /**
   * 템플릿 수정
   */
  async updateTemplate(userId: string, templateId: string, updateTemplateDto: UpdateTemplateDto) {
    await this.getTemplateById(userId, templateId);

    const { title, description, recurrenceType, recurrenceDays, endDate, isActive } = updateTemplateDto;

    return this.prisma.todoTemplate.update({
      where: { id: templateId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(recurrenceType !== undefined && { recurrenceType }),
        ...(recurrenceDays !== undefined && { recurrenceDays }),
        ...(endDate !== undefined && { endDate: this.normalizeDate(endDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  /**
   * 템플릿 삭제 (미래 인스턴스도 함께 삭제)
   */
  async deleteTemplate(userId: string, templateId: string) {
    await this.getTemplateById(userId, templateId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 미래 인스턴스 카운트 (통계 업데이트용)
    const futureInstances = await this.prisma.todoInstance.findMany({
      where: {
        templateId,
        date: { gte: today },
      },
    });

    const totalToDelete = futureInstances.length;
    const completedToDelete = futureInstances.filter((i) => i.isCompleted).length;

    // 미래 인스턴스 삭제
    await this.prisma.todoInstance.deleteMany({
      where: {
        templateId,
        date: { gte: today },
      },
    });

    // 템플릿 삭제
    await this.prisma.todoTemplate.delete({
      where: { id: templateId },
    });

    // 통계 업데이트
    if (totalToDelete > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalTodos: { decrement: totalToDelete },
          completedTodos: { decrement: completedToDelete },
        },
      });
    }
  }
}
