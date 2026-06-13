/**
 * 날짜를 해당 일의 시작(00:00:00.000)으로 정규화
 */
export function startOfDay(date: Date | string): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 날짜를 해당 일의 끝(23:59:59.999)으로 정규화
 */
export function endOfDay(date: Date | string): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
