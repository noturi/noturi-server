import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { TodosService } from './todos.service';
import { TodosStatsService } from './todos-stats.service';

@Injectable()
export class TodosSchedulerService {
  private readonly logger = new Logger(TodosSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly todosService: TodosService,
    private readonly todosStatsService: TodosStatsService,
  ) {}

  /**
   * 매일 자정에 어제 미완료 투두를 오늘로 이월 (최대 3회)
   */
  @Cron('1 0 * * *', { name: 'todo-carry-over-uncompleted' })
  async carryOverUncompletedTodos() {
    this.logger.log('미완료 투두 이월 시작');

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(today);

      // 어제 날짜의 미완료 투두
      const uncompletedTodos = await this.prisma.todoInstance.findMany({
        where: {
          date: { gte: yesterday, lt: yesterdayEnd },
          isCompleted: false,
        },
      });

      let totalCarriedOver = 0;

      for (const todo of uncompletedTodos) {
        await this.prisma.todoInstance.create({
          data: {
            title: todo.title,
            description: todo.description,
            date: today,
            isCompleted: false,
            carryOverCount: todo.carryOverCount + 1,
            userId: todo.userId,
            // templateId는 null로 설정 (unique 제약조건 충돌 방지)
          },
        });

        // 통계 업데이트 (새 인스턴스이므로 totalTodos 증가)
        await this.prisma.user.update({
          where: { id: todo.userId },
          data: { totalTodos: { increment: 1 } },
        });

        totalCarriedOver++;
      }

      this.logger.log(`미완료 투두 이월 완료: ${totalCarriedOver}개`);
    } catch (error) {
      this.logger.error('미완료 투두 이월 실패', error);
    }
  }

  /**
   * 매일 자정에 7일치 반복 투두 인스턴스 생성
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'todo-generate-daily-instances' })
  async generateDailyInstances() {
    this.logger.log('반복 투두 인스턴스 생성 시작');

    try {
      // 활성화된 모든 템플릿 조회
      const templates = await this.prisma.todoTemplate.findMany({
        where: {
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        select: {
          id: true,
          userId: true,
        },
      });

      let totalCreated = 0;

      for (const template of templates) {
        const instances = await this.todosService.generateInstances(template.id, template.userId, 7);
        totalCreated += instances.length;
      }

      this.logger.log(`반복 투두 인스턴스 생성 완료: ${totalCreated}개`);
    } catch (error) {
      this.logger.error('반복 투두 인스턴스 생성 실패', error);
    }
  }

  /**
   * 매일 자정에 모든 사용자의 연속 달성일(streak) 업데이트
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'todo-update-all-streaks' })
  async updateAllStreaks() {
    this.logger.log('연속 달성일 업데이트 시작');

    try {
      // 투두가 있는 모든 사용자 조회
      const users = await this.prisma.user.findMany({
        where: {
          totalTodos: { gt: 0 },
        },
        select: { id: true },
      });

      for (const user of users) {
        await this.todosStatsService.updateStreak(user.id);
      }

      this.logger.log(`연속 달성일 업데이트 완료: ${users.length}명`);
    } catch (error) {
      this.logger.error('연속 달성일 업데이트 실패', error);
    }
  }

  /**
   * 만료된 템플릿 비활성화 (종료일이 지난 템플릿)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'todo-deactivate-expired-templates' })
  async deactivateExpiredTemplates() {
    this.logger.log('만료된 템플릿 비활성화 시작');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const result = await this.prisma.todoTemplate.updateMany({
        where: {
          isActive: true,
          endDate: {
            lte: yesterday,
          },
        },
        data: {
          isActive: false,
        },
      });

      if (result.count > 0) {
        this.logger.log(`만료된 템플릿 비활성화 완료: ${result.count}개`);
      }
    } catch (error) {
      this.logger.error('만료된 템플릿 비활성화 실패', error);
    }
  }
}
