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
   * 매일 자정에 7일치 반복 투두 인스턴스 생성
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyInstances() {
    this.logger.log('반복 투두 인스턴스 생성 시작');

    try {
      // 활성화된 모든 템플릿 조회
      const templates = await this.prisma.todoTemplate.findMany({
        where: {
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
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
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
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
