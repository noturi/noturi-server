import { NotFoundException } from '@nestjs/common';
import { TodosService } from './todos.service';
import { RecurrenceType } from './enums/recurrence-type.enum';

function setup() {
  const prisma = {
    todoTemplate: {
      findFirst: jest.fn().mockResolvedValue({ id: 'template-1', userId: 'user-1' }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    },
  };
  return { service: new TodosService(prisma as any), prisma };
}

// private 반복 규칙 판정 함수
const matches = (date: Date, type: RecurrenceType, days: number[] = []) =>
  (setup().service as any).isDateMatchingRecurrence(date, type, days) as boolean;

describe('TodosService 반복 규칙 판정', () => {
  it('DAILY는 항상 해당한다', () => {
    expect(matches(new Date(2026, 9, 15), RecurrenceType.DAILY)).toBe(true);
  });

  it('WEEKLY는 선택한 요일에만 해당한다 (0 = 일요일)', () => {
    // 2026-10-18 = 일요일, 2026-10-19 = 월요일
    expect(matches(new Date(2026, 9, 18), RecurrenceType.WEEKLY, [0])).toBe(true);
    expect(matches(new Date(2026, 9, 19), RecurrenceType.WEEKLY, [0])).toBe(false);
  });

  it('MONTHLY는 선택한 날짜에만 해당한다', () => {
    expect(matches(new Date(2026, 9, 15), RecurrenceType.MONTHLY, [15])).toBe(true);
    expect(matches(new Date(2026, 9, 16), RecurrenceType.MONTHLY, [15])).toBe(false);
  });

  // 말일 대체 여부는 제품 결정 사항 — 현재 동작을 기록해둔다
  it('[현재 동작] MONTHLY 31일 선택 시 30일까지인 달에는 생성되지 않는다', () => {
    expect(matches(new Date(2026, 10, 30), RecurrenceType.MONTHLY, [31])).toBe(false);
  });
});

describe('TodosService.updateTemplate', () => {
  it('다른 사용자의 템플릿이면 404를 던진다', async () => {
    const { service, prisma } = setup();
    prisma.todoTemplate.findFirst.mockResolvedValue(null);

    await expect(service.updateTemplate('user-2', 'template-1', { title: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.todoTemplate.findFirst).toHaveBeenCalledWith({ where: { id: 'template-1', userId: 'user-2' } });
  });

  it('보낸 필드만 수정한다', async () => {
    const { service, prisma } = setup();
    await service.updateTemplate('user-1', 'template-1', { title: '새 제목' });

    expect(prisma.todoTemplate.update).toHaveBeenCalledWith({
      where: { id: 'template-1' },
      data: { title: '새 제목' },
    });
  });

  it('endDate는 날짜 0시로 정규화해서 저장한다', async () => {
    const { service, prisma } = setup();
    await service.updateTemplate('user-1', 'template-1', { endDate: '2026-12-31T15:30:00' });

    const { endDate } = prisma.todoTemplate.update.mock.calls[0][0].data;
    expect([endDate.getHours(), endDate.getMinutes(), endDate.getSeconds()]).toEqual([0, 0, 0]);
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────
  // @IsOptional은 null을 통과시키고 normalizeDate(null)은 1970-01-01이 되어, 다음 cron에서 템플릿이 비활성화된다.

  it('[회귀] endDate: null은 종료일 해제(null)로 저장해야 한다', async () => {
    const { service, prisma } = setup();
    await service.updateTemplate('user-1', 'template-1', { endDate: null as unknown as string });

    expect(prisma.todoTemplate.update.mock.calls[0][0].data.endDate).toBeNull();
  });
});

describe('TodosService.generateInstances', () => {
  const template = {
    id: 'template-1',
    title: '운동',
    description: null,
    isActive: true,
    recurrenceType: RecurrenceType.DAILY,
    recurrenceDays: [],
    startDate: new Date(2026, 0, 1),
    endDate: null,
  };

  function setupGenerate(createdCount: number) {
    const prisma = {
      todoTemplate: { findUnique: jest.fn().mockResolvedValue(template) },
      todoInstance: {
        findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
        createMany: jest.fn().mockResolvedValue({ count: createdCount }),
      },
      user: { update: jest.fn() },
    };
    return { service: new TodosService(prisma as any), prisma };
  }

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 15, 0, 0, 30) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 회귀: 조회와 생성 사이에 같은 날짜가 생기면 unique 충돌로 cron 전체가 멈추던 문제
  it('[회귀] 중복 날짜는 건너뛰고 생성한다 (skipDuplicates)', async () => {
    const { service, prisma } = setupGenerate(7);
    await service.generateInstances('template-1', 'user-1', 7);

    expect(prisma.todoInstance.createMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(prisma.todoInstance.createMany.mock.calls[0][0].data).toHaveLength(7);
  });

  it('통계는 실제로 생성된 개수만큼만 올린다', async () => {
    const { service, prisma } = setupGenerate(5);
    await service.generateInstances('template-1', 'user-1', 7);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { totalTodos: { increment: 5 } },
    });
  });

  it('하나도 생성되지 않았으면 통계를 건드리지 않는다', async () => {
    const { service, prisma } = setupGenerate(0);
    await service.generateInstances('template-1', 'user-1', 7);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
