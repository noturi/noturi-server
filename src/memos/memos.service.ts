// src/memos/memos.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateMemoDto, QueryMemoDto, UpdateMemoDto } from './dto';

@Injectable()
export class MemosService {
  constructor(private prisma: PrismaService) {}

  // 메모 생성
  async create(userId: string, createMemoDto: CreateMemoDto) {
    await this.validateCategoryOwnership(userId, createMemoDto.categoryId);

    const memo = await this.prisma.memo.create({
      data: {
        ...createMemoDto,
        userId,
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
    return {
      ...memo,
      rating: Number(memo.rating),
    };
  }

  // 메모 목록 조회 (필터링 + 페이징)
  async findAll(userId: string, queryDto: QueryMemoDto) {
    const {
      categoryId,
      rating,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = queryDto;

    // where 조건 구성
    const where: Prisma.MemoWhereInput = { userId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (rating) {
      where.rating = rating;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const orderBy = { [sortBy]: sortOrder };

    // 총 개수와 데이터 병렬 조회
    const [total, memos] = await Promise.all([
      this.prisma.memo.count({ where }),
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: memos.map((memo) => ({ ...memo, rating: Number(memo.rating) })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 특정 메모 조회
  async findOne(userId: string, id: string) {
    const memo = await this.prisma.memo.findFirst({
      where: { id, userId },
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

    return {
      ...memo,
      rating: Number(memo.rating),
    };
  }

  // 메모 수정
  async update(userId: string, id: string, updateMemoDto: UpdateMemoDto) {
    const memo = await this.prisma.memo.findFirst({
      where: { id, userId },
    });

    if (!memo) {
      throw new NotFoundException('메모를 찾을 수 없습니다.');
    }

    // 카테고리 변경하는 경우 소유권 확인
    if (updateMemoDto.categoryId) {
      await this.validateCategoryOwnership(userId, updateMemoDto.categoryId);
    }

    const updatedMemo = await this.prisma.memo.update({
      where: { id },
      data: updateMemoDto,
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

    return {
      ...updatedMemo,
      rating: Number(updatedMemo.rating),
    };
  }

  // 메모 삭제
  async remove(userId: string, id: string) {
    const memo = await this.prisma.memo.findFirst({
      where: { id, userId },
    });

    if (!memo) {
      throw new NotFoundException('메모를 찾을 수 없습니다.');
    }

    return this.prisma.memo.delete({
      where: { id },
    });
  }

  // 카테고리별 메모 통계
  async getStatsByCategory(userId: string) {
    const stats = await this.prisma.memo.groupBy({
      by: ['categoryId'],
      where: { userId },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });
    return stats.map((stat) => ({
      ...stat,
      _avg: {
        rating: stat._avg.rating ? Number(stat._avg.rating.toFixed(1)) : null,
      },
    }));
  }

  // 별점별 메모 통계
  async getStatsByRating(userId: string) {
    const stats = await this.prisma.memo.groupBy({
      by: ['rating'],
      where: { userId },
      _count: {
        id: true,
      },
      orderBy: {
        rating: 'asc',
      },
    });
    return stats.map((stat) => ({ ...stat, rating: Number(stat.rating) }));
  }

  // 베스트 메모들 (4.5점 이상)
  async getBestMemos(userId: string, limit: number = 10) {
    const memos = await this.prisma.memo.findMany({
      where: {
        userId,
        rating: { gte: 4.5 },
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
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return memos.map((memo) => ({ ...memo, rating: Number(memo.rating) }));
  }

  // 최근 메모들
  async getRecentMemos(userId: string, limit: number = 10) {
    const memos = await this.prisma.memo.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return memos.map((memo) => ({ ...memo, rating: Number(memo.rating) }));
  }

  // 카테고리 소유권 확인
  private async validateCategoryOwnership(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('유효하지 않은 카테고리입니다');
    }

    return category;
  }
}
