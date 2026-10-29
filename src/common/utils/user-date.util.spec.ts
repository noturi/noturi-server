import { addDays, isValidTimeZone, localDateOf, localYearRange, startOfLocalDay } from './user-date.util';

const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('localDateOf', () => {
  it('한국 자정 직후는 UTC로 아직 전날이어도 한국 날짜를 돌려준다', () => {
    expect(localDateOf('Asia/Seoul', new Date('2026-10-28T15:05:00Z'))).toEqual(date(2026, 10, 29));
  });

  it('UTC보다 늦은 지역은 전날일 수 있다', () => {
    expect(localDateOf('America/New_York', new Date('2026-10-29T02:00:00Z'))).toEqual(date(2026, 10, 28));
  });

  it('잘못되거나 없는 시간대는 한국 시간으로 계산한다', () => {
    const at = new Date('2026-10-28T15:05:00Z');
    expect(localDateOf('Not/AZone', at)).toEqual(date(2026, 10, 29));
    expect(localDateOf(undefined, at)).toEqual(date(2026, 10, 29));
  });
});

describe('isValidTimeZone', () => {
  it('IANA 시간대만 허용한다', () => {
    expect(isValidTimeZone('Asia/Seoul')).toBe(true);
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Mars/Base')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    expect(isValidTimeZone(['Asia/Seoul'])).toBe(false);
  });
});

describe('addDays', () => {
  it('서버 시간대와 무관하게 하루 단위로 더한다', () => {
    expect(addDays(date(2026, 10, 31), 1)).toEqual(date(2026, 11, 1));
    expect(addDays(date(2026, 1, 1), -1)).toEqual(date(2025, 12, 31));
  });
});

describe('startOfLocalDay / localYearRange', () => {
  it('서울 1월 1일 0시는 UTC로 전날 15시', () => {
    expect(startOfLocalDay('Asia/Seoul', 2026, 1, 1)).toEqual(new Date('2025-12-31T15:00:00Z'));
  });

  it('UTC보다 늦은 지역은 UTC로 같은 날 오후 이후', () => {
    expect(startOfLocalDay('America/New_York', 2026, 1, 1)).toEqual(new Date('2026-01-01T05:00:00Z'));
  });

  it('서머타임 중인 날짜도 맞게 계산한다', () => {
    // 뉴욕 7월은 UTC-4
    expect(startOfLocalDay('America/New_York', 2026, 7, 1)).toEqual(new Date('2026-07-01T04:00:00Z'));
  });

  // 회귀: 연도 필터를 UTC 1/1 0시로 잘라 한국 1/1 0~9시 메모가 전년도로 잡히던 문제
  it('[회귀] 한국 1월 1일 새벽 메모는 그 해에 들어간다', () => {
    const range = localYearRange('Asia/Seoul', 2026);
    const memoAt = new Date('2025-12-31T16:00:00Z'); // 한국 2026-01-01 01:00
    expect(memoAt >= range.gte && memoAt < range.lt).toBe(true);
  });
});
