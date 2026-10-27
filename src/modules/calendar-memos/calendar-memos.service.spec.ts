import { NotFoundException } from '@nestjs/common';
import { CalendarMemosService } from './calendar-memos.service';

const START = '2026-11-01T10:00:00.000Z';

const sentMemo = (overrides: Record<string, unknown> = {}) => ({
  id: 'cal-1',
  userId: 'user-1',
  title: '회의',
  startDate: new Date(START),
  endDate: new Date('2026-11-01T11:00:00.000Z'),
  isAllDay: false,
  hasNotification: true,
  notifyBefore: 'TEN_MINUTES_BEFORE',
  notificationSent: true,
  ...overrides,
});

function setup(current: unknown = sentMemo()) {
  const prisma = {
    calendarMemo: {
      findFirst: jest.fn().mockResolvedValue(current),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    },
  };
  return { service: new CalendarMemosService(prisma as any), prisma };
}

const updatedData = (prisma: ReturnType<typeof setup>['prisma']) => prisma.calendarMemo.update.mock.calls[0][0].data;

describe('CalendarMemosService.updateCalendarMemo', () => {
  it('다른 사용자의 일정이면 404를 던진다', async () => {
    const { service } = setup(null);

    await expect(service.updateCalendarMemo('user-2', 'cal-1', { title: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('시작 시각이 바뀌면 알림을 다시 보내도록 notificationSent를 초기화한다', async () => {
    const { service, prisma } = setup();
    await service.updateCalendarMemo('user-1', 'cal-1', { startDate: '2026-11-08T10:00:00.000Z' });

    expect(updatedData(prisma).notificationSent).toBe(false);
  });

  it('알림 시점(notifyBefore)이 바뀌면 notificationSent를 초기화한다', async () => {
    const { service, prisma } = setup();
    await service.updateCalendarMemo('user-1', 'cal-1', { notifyBefore: 'ONE_HOUR_BEFORE' as any });

    expect(updatedData(prisma).notificationSent).toBe(false);
  });

  it('알림을 새로 켜면 notificationSent를 초기화한다', async () => {
    const { service, prisma } = setup(sentMemo({ hasNotification: false }));
    await service.updateCalendarMemo('user-1', 'cal-1', { hasNotification: true });

    expect(updatedData(prisma).notificationSent).toBe(false);
  });

  it('폼 전체를 같은 값으로 다시 보내면 초기화하지 않는다 (중복 발송 방지)', async () => {
    const { service, prisma } = setup();
    await service.updateCalendarMemo('user-1', 'cal-1', {
      title: '회의 (수정)',
      startDate: START,
      hasNotification: true,
      notifyBefore: 'TEN_MINUTES_BEFORE' as any,
    });

    expect(updatedData(prisma)).not.toHaveProperty('notificationSent');
    expect(updatedData(prisma).title).toBe('회의 (수정)');
  });
});
