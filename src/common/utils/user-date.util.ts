/**
 * 사용자 시간대 기준 날짜 계산
 *
 * 투두의 date 컬럼은 "달력 날짜"를 UTC 자정으로 저장한다 (클라이언트가 보낸 'YYYY-MM-DD' → YYYY-MM-DDT00:00:00Z).
 * 서버는 UTC로 실행되므로(Dockerfile TZ=UTC) "오늘"은 서버 시각이 아니라 사용자 시간대의 달력 날짜로 구해야 한다.
 * 예) 한국 10/29 00:05 = UTC 10/28 15:05 → 서버 기준으론 아직 10/28이지만 사용자의 오늘은 10/29
 */

/** 시간대를 보내지 않는 구버전 앱·기존 사용자의 기본값 */
export const DEFAULT_TIMEZONE = 'Asia/Seoul';

const DAY_MS = 24 * 60 * 60 * 1000;

/** IANA 시간대 이름인지 (예: 'Asia/Seoul', 'America/New_York') */
export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || timeZone.length === 0 || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** 해당 시각의 사용자 현지 날짜 — 투두 date 컬럼과 같은 형식(UTC 자정)으로 반환 */
export function localDateOf(timeZone: string | null | undefined, at: Date = new Date()): Date {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
}

/** 날짜(UTC 자정)에 일수를 더함 — 서버 로컬 시간대와 무관 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** 해당 시각에서 시간대의 UTC 대비 차이(ms) — 예: 서울은 +9시간 */
function timeZoneOffsetMs(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wallClockAsUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** 사용자 시간대의 그 날짜 0시가 실제로 언제인지 (UTC 시각) — 예: 서울 1/1 0시 = UTC 12/31 15시 */
export function startOfLocalDay(timeZone: string | null | undefined, year: number, month: number, day: number): Date {
  const zone = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE;
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - timeZoneOffsetMs(zone, new Date(guess));
  // 서머타임 경계 근처면 오프셋이 달라질 수 있어 한 번 더 보정
  return new Date(guess - timeZoneOffsetMs(zone, new Date(first)));
}

/** 사용자 시간대 기준 그 해의 범위 — createdAt 같은 실제 시각 컬럼 필터용 */
export function localYearRange(timeZone: string | null | undefined, year: number): { gte: Date; lt: Date } {
  return { gte: startOfLocalDay(timeZone, year, 1, 1), lt: startOfLocalDay(timeZone, year + 1, 1, 1) };
}
