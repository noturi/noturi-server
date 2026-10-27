import { StatisticsService } from './statistics.service';

// Prisma where의 createdAt 범위 조건에 날짜가 포함되는지 판정
type DateRange = { gte?: Date; gt?: Date; lte?: Date; lt?: Date };
const inRange = (date: Date, range: DateRange) =>
  (!range.gte || date >= range.gte) &&
  (!range.gt || date > range.gt) &&
  (!range.lte || date <= range.lte) &&
  (!range.lt || date < range.lt);

function setup() {
  const prisma = {
    memo: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    category: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  return { service: new StatisticsService(prisma as any), prisma };
}

// memo.count 호출 순서: [전체, 이번 달, 지난달]
const lastMonthRange = (prisma: ReturnType<typeof setup>['prisma']): DateRange =>
  prisma.memo.count.mock.calls[2][0].where.createdAt;

describe('StatisticsService.getUserStatistics', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 15, 12, 0, 0) }); // 2026-10-15
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('지난달 첫날 0시 메모는 지난달 집계에 포함된다', async () => {
    const { service, prisma } = setup();
    await service.getUserStatistics('user-1', {});

    expect(inRange(new Date(2026, 8, 1, 0, 0, 0), lastMonthRange(prisma))).toBe(true);
  });

  it('이번 달 첫날 메모는 지난달 집계에 포함되지 않는다', async () => {
    const { service, prisma } = setup();
    await service.getUserStatistics('user-1', {});

    expect(inRange(new Date(2026, 9, 1, 0, 0, 0), lastMonthRange(prisma))).toBe(false);
  });

  it('지난달 대비 증가율을 계산한다', async () => {
    const { service, prisma } = setup();
    // 전체, 이번 달, 지난달 순
    prisma.memo.count.mockResolvedValueOnce(30).mockResolvedValueOnce(15).mockResolvedValueOnce(10);

    const result = await service.getUserStatistics('user-1', {});

    expect(result.thisMonthMemos).toBe(15);
    expect(result.lastMonthMemos).toBe(10);
    expect(result.growthRate).toBe(50);
  });

  it('지난달 메모가 없으면 이번 달 메모 유무로 100/0을 반환한다', async () => {
    const { service, prisma } = setup();
    prisma.memo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3).mockResolvedValueOnce(0);

    expect((await service.getUserStatistics('user-1', {})).growthRate).toBe(100);
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────
  // lastMonthEnd = new Date(y, m, 0)은 말일 00:00이라 lte로 쓰면 말일 하루치가 빠진다.

  it('[회귀] 지난달 말일 오후 메모도 지난달 집계에 포함되어야 한다', async () => {
    const { service, prisma } = setup();
    await service.getUserStatistics('user-1', {});

    expect(inRange(new Date(2026, 8, 30, 15, 0, 0), lastMonthRange(prisma))).toBe(true);
  });
});
