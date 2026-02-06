import { isHoliday } from '@hyunbinseo/holidays-kr';

/**
 * 주어진 날짜가 한국 공휴일인지 확인
 * @param date 확인할 날짜
 * @returns 공휴일이면 true
 */
export function isKoreanHoliday(date: Date): boolean {
  return isHoliday(date);
}
