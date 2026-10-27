import { TodosStatsService } from './todos-stats.service';

// 기준일: 2026-10-15
const TODAY = new Date(2026, 9, 15);
const day = (offset: number) => new Date(2026, 9, 15 + offset);

// offset별 [전체, 완료] 개수로 투두 목록 생성 (offset 0 = 오늘, -1 = 어제)
const todosOf = (days: Record<number, [number, number]>) =>
  Object.entries(days).flatMap(([offset, [total, completed]]) =>
    Array.from({ length: total }, (_, i) => ({ date: day(Number(offset)), isCompleted: i < completed })),
  );

function setup(todos: unknown[], bestStreak = 0) {
  const prisma = {
    todoInstance: { findMany: jest.fn().mockResolvedValue(todos) },
    user: {
      findUnique: jest.fn().mockResolvedValue({ bestStreak }),
      update: jest.fn().mockResolvedValue(undefined),
    },
  };
  return { service: new TodosStatsService(prisma as any), prisma };
}

const savedStreak = (prisma: ReturnType<typeof setup>['prisma']) => prisma.user.update.mock.calls[0][0].data;

describe('TodosStatsService.updateStreak', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 15, 0, 5) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('오늘까지 모두 완료했으면 오늘을 포함해 센다', async () => {
    const { service, prisma } = setup(todosOf({ 0: [2, 2], [-1]: [1, 1], [-2]: [1, 1] }));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(3);
  });

  // 회귀: 자정 직후 오늘 투두가 미완료라 매일 streak이 0으로 리셋되던 문제
  it('[회귀] 오늘이 아직 미완료면 어제부터 센다', async () => {
    const { service, prisma } = setup(todosOf({ 0: [2, 0], [-1]: [1, 1], [-2]: [1, 1] }));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(2);
  });

  it('오늘 투두가 없어도 어제부터 센다', async () => {
    const { service, prisma } = setup(todosOf({ [-1]: [1, 1] }));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(1);
  });

  it('어제를 다 못 끝냈으면 0이다', async () => {
    const { service, prisma } = setup(todosOf({ [-1]: [2, 1], [-2]: [1, 1] }));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(0);
  });

  it('투두가 없는 날에서 끊긴다', async () => {
    const { service, prisma } = setup(todosOf({ [-1]: [1, 1], [-3]: [1, 1] }));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(1);
  });

  // 회귀: 조회 범위가 30일이라 streak이 31일을 넘지 못하던 문제
  it('[회귀] 30일을 넘는 연속 기록도 센다', async () => {
    const days: Record<number, [number, number]> = {};
    for (let i = 1; i <= 45; i++) days[-i] = [1, 1];
    const { service, prisma } = setup(todosOf(days));
    await service.updateStreak('user-1');

    expect(savedStreak(prisma).currentStreak).toBe(45);
    expect(prisma.todoInstance.findMany.mock.calls[0][0].where.date.lte).toEqual(TODAY);
  });

  it('bestStreak은 기존 값보다 작아지지 않는다', async () => {
    const { service, prisma } = setup(todosOf({ [-1]: [1, 1] }), 10);
    await service.updateStreak('user-1');

    expect(savedStreak(prisma)).toEqual({ currentStreak: 1, bestStreak: 10 });
  });
});
