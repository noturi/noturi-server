import { Prisma } from '@prisma/client';
import { MemosService } from './memos.service';

function setup({ counts = [] as { rating: number | null; count: number }[] } = {}) {
  const prisma = {
    memo: {
      groupBy: jest.fn().mockResolvedValue(
        counts.map(({ rating, count }) => ({
          rating: rating === null ? null : new Prisma.Decimal(rating),
          _count: { _all: count },
        })),
      ),
      findMany: jest.fn(({ where }) => Promise.resolve([{ id: `memo-${JSON.stringify(where.rating)}` }])),
      count: jest.fn().mockResolvedValue(0),
    },
  };
  const service = new MemosService(prisma as any);
  return { service, prisma };
}

describe('MemosService.getRatingSummary', () => {
  it('별점 5 → 1 → 별점 없음 순으로 그룹을 돌려주고, 0.5 단위 별점은 내림한 그룹에 센다', async () => {
    const { service } = setup({
      counts: [
        { rating: 5, count: 2 },
        { rating: 4.5, count: 3 },
        { rating: 4, count: 1 },
        { rating: 1.5, count: 1 },
        { rating: null, count: 4 },
      ],
    });
    const { groups } = await service.getRatingSummary('user-1', {});

    expect(groups.map((g) => [g.rating, g.total])).toEqual([
      [5, 2],
      [4, 4],
      [3, 0],
      [2, 0],
      [1, 1],
      [0, 4],
    ]);
  });

  it('그룹마다 별점 범위로 최근 메모 limit개를 조회한다', async () => {
    const { service, prisma } = setup();
    await service.getRatingSummary('user-1', { limit: 3 });

    const calls = prisma.memo.findMany.mock.calls.map(([arg]) => arg);
    expect(calls.map((c) => c.where.rating)).toEqual([
      { gte: 5, lt: 6 },
      { gte: 4, lt: 5 },
      { gte: 3, lt: 4 },
      { gte: 2, lt: 3 },
      { gte: 1, lt: 2 },
      null,
    ]);
    expect(calls[0]).toEqual(expect.objectContaining({ take: 3, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }));
  });

  it('카테고리·연도 필터를 개수와 목록 모두에 적용한다 (연도는 사용자 시간대 기준)', async () => {
    const { service, prisma } = setup();
    await service.getRatingSummary('user-1', { categoryId: 'cat-1', year: 2026 }, 'Asia/Seoul');

    const expected = {
      userId: 'user-1',
      categoryId: 'cat-1',
      // 한국 2026-01-01 0시 ~ 2027-01-01 0시
      createdAt: { gte: new Date('2025-12-31T15:00:00.000Z'), lt: new Date('2026-12-31T15:00:00.000Z') },
    };
    expect(prisma.memo.groupBy.mock.calls[0][0].where).toEqual(expected);
    expect(prisma.memo.findMany.mock.calls[0][0].where).toEqual(expect.objectContaining(expected));
  });
});

describe('MemosService.getMemos', () => {
  // 회귀: 클라이언트가 sortBy=createdAt을 보내도 무시하고 수정일시로만 정렬하던 문제
  it('[회귀] 요청한 정렬 기준을 따른다', async () => {
    const { service, prisma } = setup();
    await service.getMemos('user-1', { sortBy: 'createdAt', sortOrder: 'desc' });

    expect(prisma.memo.findMany.mock.calls[0][0].orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('정렬을 지정하지 않으면 수정일시 내림차순', async () => {
    const { service, prisma } = setup();
    await service.getMemos('user-1', {});

    expect(prisma.memo.findMany.mock.calls[0][0].orderBy).toEqual([{ updatedAt: 'desc' }, { id: 'desc' }]);
  });
});
