import { TodosSchedulerService } from './todos-scheduler.service';

const uncompleted = (overrides: Record<string, unknown> = {}) => ({
  id: 'todo-1',
  title: '운동',
  description: null,
  date: new Date(2026, 9, 14),
  isCompleted: false,
  carryOverCount: 0,
  userId: 'user-1',
  templateId: null,
  ...overrides,
});

function setup(todos: unknown[]) {
  const prisma = {
    todoInstance: {
      findMany: jest.fn().mockResolvedValue(todos),
      create: jest.fn().mockResolvedValue(undefined),
    },
    user: { update: jest.fn().mockResolvedValue(undefined) },
  };
  const service = new TodosSchedulerService(prisma as any, {} as any, {} as any);
  return { service, prisma };
}

describe('TodosSchedulerService.carryOverUncompletedTodos', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 15, 0, 1, 0) }); // 2026-10-15 00:01
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 대상 필터는 DB 쿼리 조건으로 걸리므로 where를 검증한다
  const findWhere = (prisma: ReturnType<typeof setup>['prisma']) =>
    prisma.todoInstance.findMany.mock.calls[0][0].where;

  it('어제의 미완료 투두만 조회한다', async () => {
    const { service, prisma } = setup([]);
    await service.carryOverUncompletedTodos();

    expect(findWhere(prisma)).toEqual(
      expect.objectContaining({
        date: { gte: new Date(2026, 9, 14), lt: new Date(2026, 9, 15) },
        isCompleted: false,
      }),
    );
  });

  it('미완료 투두를 오늘 날짜로 복사하고 carryOverCount를 1 올린다', async () => {
    const { service, prisma } = setup([uncompleted({ carryOverCount: 1 })]);
    await service.carryOverUncompletedTodos();

    expect(prisma.todoInstance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: '운동',
        date: new Date(2026, 9, 15),
        isCompleted: false,
        carryOverCount: 2,
        userId: 'user-1',
      }),
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { totalTodos: { increment: 1 } },
    });
  });

  it('조회 중 에러가 나도 cron이 예외를 밖으로 던지지 않는다', async () => {
    const { service, prisma } = setup([]);
    prisma.todoInstance.findMany.mockRejectedValue(new Error('db down'));

    await expect(service.carryOverUncompletedTodos()).resolves.toBeUndefined();
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────

  it('[회귀] 이미 3회 이월된 투두는 더 이상 이월하지 않아야 한다 (최대 3회)', async () => {
    const { service, prisma } = setup([]);
    await service.carryOverUncompletedTodos();

    expect(findWhere(prisma).carryOverCount).toEqual({ lt: 3 });
  });

  it('[회귀] 반복 템플릿 인스턴스는 이월하지 않아야 한다 (다음 반복일에 새로 생성됨)', async () => {
    const { service, prisma } = setup([]);
    await service.carryOverUncompletedTodos();

    expect(findWhere(prisma).templateId).toBeNull();
  });
});

describe('TodosSchedulerService.generateDailyInstances', () => {
  // 회귀: 템플릿 하나가 실패하면 나머지 템플릿 전부가 그날 생성되지 않던 문제
  it('[회귀] 한 템플릿이 실패해도 나머지 템플릿은 생성한다', async () => {
    const prisma = {
      todoTemplate: {
        findMany: jest.fn().mockResolvedValue([
          { id: 't1', userId: 'u1' },
          { id: 't2', userId: 'u2' },
          { id: 't3', userId: 'u3' },
        ]),
      },
    };
    const todosService = {
      generateInstances: jest
        .fn()
        .mockResolvedValueOnce([{}])
        .mockRejectedValueOnce(new Error('P2002'))
        .mockResolvedValueOnce([{}, {}]),
    };
    const service = new TodosSchedulerService(prisma as any, todosService as any, {} as any);

    await service.generateDailyInstances();

    expect(todosService.generateInstances).toHaveBeenCalledTimes(3);
    expect(todosService.generateInstances).toHaveBeenLastCalledWith('t3', 'u3', 7);
  });
});
