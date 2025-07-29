// src/categories/categories.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { memos: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { memos: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    return category;
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
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

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
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { memos: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다');
    }

    if (category._count.memos > 0) {
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
