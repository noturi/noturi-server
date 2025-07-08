// src/categories/categories.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // 방법 1: _count 없이 별도로 계산
  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // 각 카테고리별 메모 개수 추가
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const memoCount = await this.prisma.memo.count({
          where: { categoryId: category.id },
        });
        return {
          ...category,
          _count: { memos: memoCount },
        };
      }),
    );

    return categoriesWithCount;
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    const memoCount = await this.prisma.memo.count({
      where: { categoryId: id },
    });

    return {
      ...category,
      _count: { memos: memoCount },
    };
  }

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          userId,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(userId, id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const memoCount = await this.prisma.memo.count({
      where: { categoryId: id },
    });

    if (memoCount > 0) {
      throw new ConflictException('메모가 있는 카테고리는 삭제할 수 없습니다');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  private handlePrismaError(error: any): never {
    if (error.code === 'P2002') {
      throw new ConflictException('이미 존재하는 카테고리 이름입니다');
    }
    throw error;
  }
}
