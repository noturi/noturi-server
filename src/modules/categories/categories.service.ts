// src/categories/categories.service.ts
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: MEMO_COUNT_INCLUDE,
    });

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category._count.memos > 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          code: AppErrorCode.CATEGORY_HAS_MEMOS,
          message: '메모가 있는 카테고리는 삭제할 수 없습니다',
          details: { memoCount: category._count.memos },
        },
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async reorder(userId: string, reorderDto: ReorderCategoriesDto) {
    const updates = reorderDto.categories.map(({ id, sortOrder }) =>
      this.prisma.category.updateMany({
        where: { id, userId },
        data: { sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAll(userId);
  }
}
