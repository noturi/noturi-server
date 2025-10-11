import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMemoDto, QueryMemoDto, UpdateMemoDto } from './client/dto';

@Injectable()
export class MemosService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemo(userId: string, createMemoDto: CreateMemoDto) {
    const { title, content, rating, categoryId, experienceDate } = createMemoDto;

    // 카테고리가 제공된 경우, 사용자 소유인지 확인
    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다');
      }
    }

    return this.prisma.memo.create({
      data: {
        title,
        content,
        rating,
        experienceDate,
        userId,
        categoryId,
      },
      include: {
        category: categoryId
          ? {
              select: {
                id: true,
                name: true,
                color: true,
              },
            }
          : false,
      },
    });
  }

  async getMemos(userId: string, queryDto: QueryMemoDto) {
    const { keyword, categoryId, page = 1, limit = 20 } = queryDto;

    const where: any = {
      userId,
      ...(categoryId && { categoryId }),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
    };

    const [memos, total] = await Promise.all([
      this.prisma.memo.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
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
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!memo) {
      throw new NotFoundException('메모를 찾을 수 없습니다');
    }

    return memo;
  }

  async updateMemo(userId: string, memoId: string, updateMemoDto: UpdateMemoDto) {
    const memo = await this.getMemoById(userId, memoId);

    const { title, content, rating, categoryId, experienceDate } = updateMemoDto;

    // 카테고리가 변경되는 경우, 해당 카테고리가 사용자 소유인지 확인
    if (categoryId && categoryId !== memo.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다');
      }
    }

    return this.prisma.memo.update({
      where: { id: memoId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(rating !== undefined && { rating }),
        ...(categoryId !== undefined && { categoryId }),
        ...(experienceDate !== undefined && { experienceDate }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
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
