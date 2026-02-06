export const CATEGORY_BRIEF_SELECT = { id: true, name: true, color: true } as const;

export const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  nickname: true,
  avatarUrl: true,
  isStatsPublic: true,
  role: true,
  createdAt: true,
} as const;

export const MEMO_COUNT_INCLUDE = { _count: { select: { memos: true } } } as const;
