// src/categories/categories.service.ts
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppErrorCode } from '../../common/errors/app-error-codes';
import { PrismaErrorHandler } from '../../common/exceptions/prisma-error.handler';
import { CreateCategoryDto, ReorderCategoriesDto, UpdateCategoryDto } from './client/dto';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';
import { MEMO_COUNT_INCLUDE } from '../../common/constants/prisma-selects';

const MAX_CATEGORIES_PER_USER = 10;

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: MEMO_COUNT_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return categories.map(({ _count, ...category }) => ({
      ...category,
      count: _count,
    }));
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: MEMO_COUNT_INCLUDE,
    });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    const { _count, ...categoryData } = category;
    return {
      ...categoryData,
      count: _count,
    };
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    // 카테고리 개수 제한 체크
    const categoryCount = await this.prisma.category.count({
      where: { userId },
    });

    if (categoryCount >= MAX_CATEGORIES_PER_USER) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          code: AppErrorCode.CATEGORY_LIMIT_EXCEEDED,
          message: `카테고리는 최대 ${MAX_CATEGORIES_PER_USER}개까지 생성할 수 있습니다`,
          details: { currentCount: categoryCount, maxCount: MAX_CATEGORIES_PER_USER },
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          userId,
        },
      });
    } catch (error) {
      PrismaErrorHandler.handle(error);
    }
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      PrismaErrorHandler.handle(error);
    }
  }

  /**
   * 카테고리 삭제 — 소속 메모는 삭제하지 않고 카테고리를 비워 '기타'로 이동
   * (메모 이동과 삭제를 하나의 트랜잭션으로 처리, 스키마도 onDelete: SetNull로 이중 보호)
   */
  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    const [{ count: movedMemoCount }, deleted] = await this.prisma.$transaction([
      this.prisma.memo.updateMany({
        where: { categoryId: id, userId },
        data: { categoryId: null },
      }),
      this.prisma.category.delete({ where: { id } }),
    ]);

    return { ...deleted, movedMemoCount };
  }


  async reorder(userId: string, reorderDto: ReorderCategoriesDto) {
    const { categories, allCategoryOrder } = reorderDto;
    const updates: Prisma.PrismaPromise<unknown>[] = categories.map(({ id, sortOrder }) =>
      this.prisma.category.updateMany({
        where: { id, userId },
        data: { sortOrder },
      }),
    );
    // "전체" 위치는 카테고리가 아니라 사용자 설정에 저장 — 카테고리 순서와 함께 원자적으로
    if (allCategoryOrder !== undefined) {
      updates.push(
        this.prisma.userSettings.upsert({
          where: { userId },
          update: { allCategoryOrder },
          create: { userId, allCategoryOrder, notification: false },
        }),
      );
    }

    await this.prisma.$transaction(updates);

    return this.findAll(userId);
  }
}
