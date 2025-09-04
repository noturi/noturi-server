import { Request } from 'express';

import { Category, User } from '@prisma/client';
import { UserRole } from '../enums/permissions.enum';

export interface UserWithCategories extends User {
  categories: Category[];
}

export interface AuthenticatedUser extends Omit<User, 'createdAt' | 'updatedAt' | 'provider' | 'providerId'> {
  categories: Category[];
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
