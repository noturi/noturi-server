import { Request } from 'express';

import { Category, User } from '@prisma/client';
import { UserRole } from '../enums/permissions.enum';

export interface UserWithCategories extends User {
  categories: Category[];
}

export interface AuthenticatedUser extends Omit<User, 'createdAt' | 'updatedAt' | 'provider' | 'providerId'> {
  categories: Category[];
  role: UserRole;
  /** 액세스 토큰의 세션 ID (RTR 도입 전 토큰은 없음) */
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
