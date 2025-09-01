import { Decimal } from '@prisma/client/runtime/library';

/**
 * Prisma Decimal을 number로 변환하는 헬퍼 함수
 */
export function convertRatingToNumber(rating: Decimal): number {
  return Number(rating);
}

/**
 * 메모 객체의 rating을 number로 변환
 */
export function convertMemoRating<T extends { rating: Decimal }>(memo: T): Omit<T, 'rating'> & { rating: number } {
  return {
    ...memo,
    rating: convertRatingToNumber(memo.rating),
  };
}

/**
 * 메모 배열의 모든 rating을 number로 변환
 */
export function convertMemoRatings<T extends { rating: Decimal }>(
  memos: T[],
): (Omit<T, 'rating'> & { rating: number })[] {
  return memos.map(convertMemoRating);
}

/**
 * 날짜 범위 생성 헬퍼 함수
 */
export interface DateRangeFilter {
  gte?: Date;
  lte?: Date;
}

/**
 * 연도와 월 기반으로 날짜 범위 생성
 */
export function createDateRangeFilter(year?: number, month?: number): DateRangeFilter | undefined {
  if (!year && !month) {
    return undefined;
  }

  const filter: DateRangeFilter = {};

  if (year && month) {
    // 특정 연도/월
    filter.gte = new Date(year, month - 1, 1);
    filter.lte = new Date(year, month, 0, 23, 59, 59);
  } else if (year) {
    // 특정 연도
    filter.gte = new Date(year, 0, 1);
    filter.lte = new Date(year, 11, 31, 23, 59, 59);
  }

  return filter;
}

/**
 * 평균 rating을 소수점 1자리로 포맷
 */
export function formatAverageRating(avgRating: Decimal | null | undefined): number {
  if (!avgRating) return 0;
  return Number(avgRating.toFixed(1));
}

/**
 * 퍼센티지 계산 헬퍼
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}
