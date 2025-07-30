import { Category, User } from '@prisma/client';

export interface UserWithCategories extends User {
  categories: Category[];
}

export interface AuthenticatedUser extends Omit<User, 'createdAt' | 'updatedAt' | 'provider' | 'providerId'> {
  categories: Category[];
}