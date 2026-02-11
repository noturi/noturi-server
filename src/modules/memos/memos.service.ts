import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMemoDto, QueryMemoDto, UpdateMemoDto } from './client/dto';
import { CATEGORY_BRIEF_SELECT } from '../../common/constants/prisma-selects';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';

@Injectable()
export class MemosService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemo(userId: string, createMemoDto: CreateMemoDto) {
    const { title, content, rating, categoryId } = createMemoDto;

    // 카테고리가 제공된 경우, 사용자 소유인지 확인
    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    return this.prisma.memo.create({
      data: {
        title,
        content,
        rating,
        userId,
        categoryId,
      },
      include: {
        category: categoryId
          ? { select: CATEGORY_BRIEF_SELECT }
          : false,
      },
    });
  }

  async getMemos(userId: string, queryDto: QueryMemoDto) {
    const { keyword, categoryId, year, minRating, maxRating, page = 1, limit: rawLimit = 20 } = queryDto;
    const limit = Math.min(rawLimit, 100);

    const where: Prisma.MemoWhereInput = {
      userId,
      ...(categoryId && { categoryId }),
      ...((minRating || maxRating) && {
        rating: {
          ...(minRating && { gte: minRating }),
          ...(maxRating && { lte: maxRating }),
        },
      }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' as const } },
          { content: { contains: keyword, mode: 'insensitive' as const } },
        ],
      }),
      ...(year && {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      }),
    };

    const [memos, total] = await Promise.all([
      this.prisma.memo.findMany({
        where,
        include: {
          category: {
            select: CATEGORY_BRIEF_SELECT,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.memo.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: memos,
      page,
      limit,
      total,
      totalPages,
    };
  }

  async getMemoById(userId: string, memoId: string) {
    const memo = await this.prisma.memo.findFirst({
      where: { id: memoId, userId },
      include: {
        category: {
          select: CATEGORY_BRIEF_SELECT,
        },
      },
    });

    if (!memo) {
      throw new NotFoundException(ERROR_MESSAGES.MEMO_NOT_FOUND);
    }

    return memo;
  }

  async updateMemo(userId: string, memoId: string, updateMemoDto: UpdateMemoDto) {
    const memo = await this.getMemoById(userId, memoId);

    const { title, content, rating, categoryId } = updateMemoDto;

    // 카테고리가 변경되는 경우, 해당 카테고리가 사용자 소유인지 확인
    if (categoryId && categoryId !== memo.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    return this.prisma.memo.update({
      where: { id: memoId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(rating !== undefined && { rating }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: {
          select: CATEGORY_BRIEF_SELECT,
        },
      },
    });
  }

  async deleteMemo(userId: string, memoId: string) {
    const memo = await this.getMemoById(userId, memoId);

    await this.prisma.memo.delete({
      where: { id: memo.id },
    });
  }
}
