import { TodosSchedulerService } from './todos-scheduler.service';

// 투두 date 컬럼 형식: 달력 날짜의 UTC 자정
const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

const uncompleted = (overrides: Record<string, unknown> = {}) => ({
  id: 'todo-1',
  title: '운동',
  description: null,
  date: date(2026, 10, 28),
  isCompleted: false,
  carryOverCount: 0,
  userId: 'user-1',
  templateId: null,
  ...overrides,
});

type User = { id: string; totalTodos: number };

function setup({
  zones = ['Asia/Seoul'],
  usersByZone = { 'Asia/Seoul': [{ id: 'user-1', totalTodos: 5 }] } as Record<string, User[]>,
  todos = [] as unknown[],
  templates = [] as { id: string }[],
  claimed = 1,
} = {}) {
  const prisma = {
    user: {
      groupBy: jest.fn().mockResolvedValue(zones.map((timezone) => ({ timezone }))),
      findMany: jest.fn(({ where }) => Promise.resolve(usersByZone[where.timezone] ?? [])),
      updateMany: jest.fn().mockResolvedValue({ count: claimed }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    todoInstance: {
      findMany: jest.fn().mockResolvedValue(todos),
      createMany: jest.fn().mockResolvedValue({ count: todos.length }),
    },
    todoTemplate: { findMany: jest.fn().mockResolvedValue(templates) },
  };
  const todosService = { generateInstances: jest.fn().mockResolvedValue([]) };
  const statsService = { updateStreak: jest.fn().mockResolvedValue(undefined) };
  const service = new TodosSchedulerService(prisma as any, todosService as any, statsService as any);
  return { service, prisma, todosService, statsService };
}

// 한국 2026-10-29 00:05 = UTC 2026-10-28 15:05
const KST_JUST_AFTER_MIDNIGHT = new Date('2026-10-28T15:05:00Z');

describe('TodosSchedulerService.runDailyRollover', () => {
  // 회귀: 서버(UTC) 기준 고정 자정 cron이라 한국에선 오전 9시에야 이월되던 문제
  it('[회귀] 한국 자정이 지나면 서버 날짜(UTC)가 아직 어제여도 한국 날짜 기준으로 마감한다', async () => {
    const { service, prisma } = setup({ todos: [uncompleted()] });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
      timezone: 'Asia/Seoul',
      lastRolloverDate: { lt: date(2026, 10, 29) },
    });
    expect(prisma.todoInstance.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ userId: 'user-1', date: { gte: date(2026, 10, 28), lt: date(2026, 10, 29) } }),
    );
    expect(prisma.todoInstance.createMany.mock.calls[0][0].data[0]).toEqual(
      expect.objectContaining({ date: date(2026, 10, 29), carryOverCount: 1 }),
    );
  });

  it('시간대마다 그 지역의 오늘로 계산한다 (글로벌)', async () => {
    const { service, prisma } = setup({ zones: ['Asia/Seoul', 'America/Los_Angeles'], usersByZone: {} });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    const todayOf = (zone: string) =>
      prisma.user.findMany.mock.calls.find(([arg]) => arg.where.timezone === zone)![0].where.lastRolloverDate.lt;
    expect(todayOf('Asia/Seoul')).toEqual(date(2026, 10, 29));
    // LA는 2026-10-28 08:05 — 아직 10/28
    expect(todayOf('America/Los_Angeles')).toEqual(date(2026, 10, 28));
  });

  it('마감 처리 날짜를 먼저 기록(선점)하고, 다른 실행이 먼저 처리했으면 건너뛴다', async () => {
    const { service, prisma, statsService } = setup({ todos: [uncompleted()], claimed: 0 });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', lastRolloverDate: { lt: date(2026, 10, 29) } },
      data: { lastRolloverDate: date(2026, 10, 29) },
    });
    expect(prisma.todoInstance.createMany).not.toHaveBeenCalled();
    expect(statsService.updateStreak).not.toHaveBeenCalled();
  });

  it('미완료 투두를 오늘로 복사하고 totalTodos를 개수만큼 올린다', async () => {
    const { service, prisma } = setup({ todos: [uncompleted({ carryOverCount: 1 }), uncompleted({ id: 'todo-2' })] });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.todoInstance.createMany.mock.calls[0][0].data).toHaveLength(2);
    expect(prisma.todoInstance.createMany.mock.calls[0][0].data[0]).toEqual(
      expect.objectContaining({ title: '운동', isCompleted: false, carryOverCount: 2, userId: 'user-1' }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { totalTodos: { increment: 2 } },
    });
  });

  it('반복 투두 생성과 연속 달성일 갱신도 함께 한다', async () => {
    const { service, todosService, statsService } = setup({ templates: [{ id: 't1' }] });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(todosService.generateInstances).toHaveBeenCalledWith('t1', 'user-1', 7);
    expect(statsService.updateStreak).toHaveBeenCalledWith('user-1');
  });

  it('투두를 한 번도 안 쓴 사용자는 날짜만 기록하고 넘어간다', async () => {
    const { service, prisma, statsService } = setup({
      usersByZone: { 'Asia/Seoul': [{ id: 'user-1', totalTodos: 0 }] },
    });
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.user.updateMany).toHaveBeenCalled();
    expect(prisma.todoInstance.findMany).not.toHaveBeenCalled();
    expect(statsService.updateStreak).not.toHaveBeenCalled();
  });

  it('조회 중 에러가 나도 cron이 예외를 밖으로 던지지 않는다', async () => {
    const { service, prisma } = setup();
    prisma.user.groupBy.mockRejectedValue(new Error('db down'));

    await expect(service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT)).resolves.toBeUndefined();
  });

  it('한 사용자가 실패해도 나머지 사용자는 처리한다', async () => {
    const { service, statsService } = setup({
      usersByZone: {
        'Asia/Seoul': [
          { id: 'user-1', totalTodos: 1 },
          { id: 'user-2', totalTodos: 1 },
        ],
      },
    });
    statsService.updateStreak.mockRejectedValueOnce(new Error('boom'));
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(statsService.updateStreak).toHaveBeenLastCalledWith('user-2');
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────

  it('[회귀] 이미 3회 이월된 투두는 더 이상 이월하지 않아야 한다 (최대 3회)', async () => {
    const { service, prisma } = setup();
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.todoInstance.findMany.mock.calls[0][0].where.carryOverCount).toEqual({ lt: 3 });
  });

  it('[회귀] 반복 템플릿 인스턴스는 이월하지 않아야 한다 (다음 반복일에 새로 생성됨)', async () => {
    const { service, prisma } = setup();
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(prisma.todoInstance.findMany.mock.calls[0][0].where.templateId).toBeNull();
  });

  // 회귀: 템플릿 하나가 실패하면 나머지 템플릿 전부가 그날 생성되지 않던 문제
  it('[회귀] 한 템플릿이 실패해도 나머지 템플릿은 생성한다', async () => {
    const { service, todosService } = setup({ templates: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] });
    todosService.generateInstances
      .mockResolvedValueOnce([{}])
      .mockRejectedValueOnce(new Error('P2002'))
      .mockResolvedValueOnce([{}, {}]);
    await service.runDailyRollover(KST_JUST_AFTER_MIDNIGHT);

    expect(todosService.generateInstances).toHaveBeenCalledTimes(3);
    expect(todosService.generateInstances).toHaveBeenLastCalledWith('t3', 'user-1', 7);
  });
});
