export interface DefaultCategory {
  name: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: '영화', color: '#FF6B6B' },
  { name: '독서', color: '#4ECDC4' },
  { name: '음악', color: '#45B7D1' },
];

// 시간 상수 (밀리초)
export const TIME_CONSTANTS = {
  REFRESH_TOKEN_EXPIRES_MS: 30 * 24 * 60 * 60 * 1000, // 30일
} as const;
