import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, localDateOf } from '../../common/utils/user-date.util';
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
   * 사용자별 하루 마감 — 각자 시간대의 자정이 지나면 처리 (15분마다 확인)
   *
   * 서버는 UTC로 돌기 때문에 고정 자정 cron은 한국 기준 오전 9시에 실행됐다.
   * 사용자마다 시간대가 다를 수 있어(글로벌) 시간대별로 "오늘"을 구해, 아직 오늘 처리 안 된 사용자만 마감한다.
   * 서버가 잠시 내려가 있었어도 다음 실행에서 따라잡는다.
   */
  @Cron('*/15 * * * *', { name: 'todo-daily-rollover' })
  async runDailyRollover(now: Date = new Date()) {
    try {
      const zones = await this.prisma.user.groupBy({ by: ['timezone'] });
      let processed = 0;

      for (const { timezone } of zones) {
        const today = localDateOf(timezone, now);
        const users = await this.prisma.user.findMany({
          where: { timezone, lastRolloverDate: { lt: today } },
          select: { id: true, totalTodos: true },
        });

        // 사용자 하나가 실패해도 나머지는 처리되도록 개별 처리
        for (const user of users) {
          try {
            if (await this.rolloverUser(user, today)) processed++;
          } catch (error) {
            this.logger.error(`하루 마감 실패 (user: ${user.id}, ${timezone})`, error);
          }
        }
      }

      if (processed > 0) this.logger.log(`하루 마감 완료: ${processed}명`);
    } catch (error) {
      this.logger.error('하루 마감 실패', error);
    }
  }

  /**
   * 한 사용자의 하루 마감: 어제 미완료 이월 → 반복 투두 생성 → 연속 달성일 갱신
   * @returns 이번 실행에서 처리했으면 true (다른 실행이 먼저 처리했으면 false)
   */
  private async rolloverUser(user: { id: string; totalTodos: number }, today: Date): Promise<boolean> {
    // 처리 날짜를 먼저 기록해 선점 — 실행이 겹쳐도 같은 날 두 번 이월되지 않음
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, lastRolloverDate: { lt: today } },
      data: { lastRolloverDate: today },
    });
    if (count === 0) return false;
    if (user.totalTodos === 0) return true;

    await this.carryOverUncompletedTodos(user.id, today);

    const templates = await this.prisma.todoTemplate.findMany({
      where: { userId: user.id, isActive: true, OR: [{ endDate: null }, { endDate: { gte: today } }] },
      select: { id: true },
    });
    for (const template of templates) {
      try {
        await this.todosService.generateInstances(template.id, user.id, 7);
      } catch (error) {
        this.logger.error(`반복 투두 인스턴스 생성 실패 (template: ${template.id})`, error);
      }
    }

    await this.todosStatsService.updateStreak(user.id);
    return true;
  }

  /**
   * 어제 미완료 일회성 투두를 오늘로 이월 (최대 3회)
   * 반복 템플릿 인스턴스는 다음 반복일에 새로 생성되므로 이월하면 중복이 쌓인다
   */
  private async carryOverUncompletedTodos(userId: string, today: Date) {
    const uncompletedTodos = await this.prisma.todoInstance.findMany({
      where: {
        userId,
        date: { gte: addDays(today, -1), lt: today },
        isCompleted: false,
        templateId: null,
        carryOverCount: { lt: 3 },
      },
    });
    if (uncompletedTodos.length === 0) return;

    await this.prisma.todoInstance.createMany({
      data: uncompletedTodos.map((todo) => ({
        title: todo.title,
        description: todo.description,
        date: today,
        isCompleted: false,
        carryOverCount: todo.carryOverCount + 1,
        userId,
        // templateId는 null로 설정 (unique 제약조건 충돌 방지)
      })),
    });

    // 통계 업데이트 (새 인스턴스이므로 totalTodos 증가)
    await this.prisma.user.update({
      where: { id: userId },
      data: { totalTodos: { increment: uncompletedTodos.length } },
    });
  }

  /**
   * 만료된 템플릿 비활성화 (종료일이 지난 템플릿)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'todo-deactivate-expired-templates' })
  async deactivateExpiredTemplates() {
    this.logger.log('만료된 템플릿 비활성화 시작');

    try {
      // 시간대가 가장 늦은 지역(UTC-12)도 종료일이 지났을 때만 — UTC 기준 이틀 전까지
      const cutoff = addDays(localDateOf('UTC'), -1);

      const result = await this.prisma.todoTemplate.updateMany({
        where: {
          isActive: true,
          endDate: {
            lt: cutoff,
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
