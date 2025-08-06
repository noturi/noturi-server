import { Category, User } from '@prisma/client';
import { Request } from 'express';

export interface UserWithCategories extends User {
  categories: Category[];
}

export interface AuthenticatedUser extends Omit<User, 'createdAt' | 'updatedAt' | 'provider' | 'providerId'> {
  categories: Category[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}