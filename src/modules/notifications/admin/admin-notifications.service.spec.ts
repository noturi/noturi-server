import { shouldSendRepeatNotification } from './admin-notifications.service';
import { NotificationRepeatType } from './enums/notification-repeat-type.enum';

// KST 기준 날짜를 판정 함수 입력 형태(getUTC*로 읽는 Date)로 생성
const kst = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day, 9, 0, 0));

describe('shouldSendRepeatNotification', () => {
  describe('WEEKLY (주간 반복)', () => {
    it('선택한 요일이면 발송한다', () => {
      // 2026-08-17 = 월요일(1)
      const result = shouldSendRepeatNotification(kst(2026, 8, 17), {
        repeatType: NotificationRepeatType.WEEKLY,
        repeatDays: [1, 3],
        sendOnLastDay: false,
      });
      expect(result).toBe(true);
    });

    it('선택하지 않은 요일이면 발송하지 않는다', () => {
      // 2026-08-18 = 화요일(2)
      const result = shouldSendRepeatNotification(kst(2026, 8, 18), {
        repeatType: NotificationRepeatType.WEEKLY,
        repeatDays: [1, 3],
        sendOnLastDay: false,
      });
      expect(result).toBe(false);
    });
  });

  describe('MONTHLY (월간 반복)', () => {
    const monthly = (repeatDays: number[], sendOnLastDay = false) => ({
      repeatType: NotificationRepeatType.MONTHLY,
      repeatDays,
      sendOnLastDay,
    });

    it('선택한 날짜면 발송한다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 8, 16), monthly([16, 25]))).toBe(true);
      expect(shouldSendRepeatNotification(kst(2026, 8, 25), monthly([16, 25]))).toBe(true);
    });

    it('선택하지 않은 날짜면 발송하지 않는다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 8, 17), monthly([16, 25]))).toBe(false);
    });

    it('31일 선택 + 30일이 말일인 달: sendOnLastDay=true면 말일에 발송한다', () => {
      // 2026-04-30 = 4월 말일
      expect(shouldSendRepeatNotification(kst(2026, 4, 30), monthly([31], true))).toBe(true);
    });

    it('31일 선택 + 30일이 말일인 달: sendOnLastDay=false면 발송하지 않는다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 4, 30), monthly([31], false))).toBe(false);
    });

    it('말일 대체는 말일에만 동작한다 (말일 전날은 발송 안 함)', () => {
      expect(shouldSendRepeatNotification(kst(2026, 4, 29), monthly([31], true))).toBe(false);
    });

    it('평년 2월: 29~31일 선택 시 2/28(말일)에 대체 발송한다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 2, 28), monthly([29], true))).toBe(true);
      expect(shouldSendRepeatNotification(kst(2026, 2, 28), monthly([29], false))).toBe(false);
    });

    it('윤년 2월: 29일 선택 시 2/29에 정상 발송하고, 30일 선택 시 2/29(말일)에 대체 발송한다', () => {
      expect(shouldSendRepeatNotification(kst(2028, 2, 29), monthly([29], false))).toBe(true);
      expect(shouldSendRepeatNotification(kst(2028, 2, 29), monthly([30], true))).toBe(true);
      // 윤년 2/28은 말일이 아니므로 대체 발송하지 않는다
      expect(shouldSendRepeatNotification(kst(2028, 2, 28), monthly([30], true))).toBe(false);
    });

    it('30·31일 동시 선택 + 30일이 말일인 달의 30일: 정상 매칭 한 번만 발송된다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 4, 30), monthly([30, 31], true))).toBe(true);
    });

    it('31일이 있는 달에는 대체 없이 31일에 발송한다', () => {
      expect(shouldSendRepeatNotification(kst(2026, 8, 31), monthly([31], true))).toBe(true);
      expect(shouldSendRepeatNotification(kst(2026, 8, 30), monthly([31], true))).toBe(false);
    });
  });
});
