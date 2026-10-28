import { addDays, isValidTimeZone, localDateOf } from './user-date.util';

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
