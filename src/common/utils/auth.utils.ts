import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

/**
 * 사용자가 특정 카테고리를 소유하고 있는지 확인하는 헬퍼 함수
 */
export async function validateUserOwnsCategory(
  prisma: PrismaService,
  userId: string,
  categoryId: string,
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw new BadRequestException('유효하지 않은 카테고리입니다');
  }
}

/**
 * 사용자가 특정 메모를 소유하고 있는지 확인하는 헬퍼 함수
 */
export async function validateUserOwnsMemo(
  prisma: PrismaService,
  userId: string,
  memoId: string,
): Promise<void> {
  const memo = await prisma.memo.findFirst({
    where: { id: memoId, userId },
  });

  if (!memo) {
    throw new BadRequestException('유효하지 않은 메모입니다');
  }
}

/**
 * 공통 where 조건 생성 헬퍼
 */
export function createUserWhereClause(userId: string, additionalConditions: Record<string, any> = {}) {
  return {
    userId,
    ...additionalConditions,
  };
}