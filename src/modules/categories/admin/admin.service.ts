import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDefaultCategoryDto, UpdateDefaultCategoryDto, ReorderDefaultCategoriesDto } from './dto';
import { PrismaErrorHandler } from '../../../common/exceptions/prisma-error.handler';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDefaultCategories() {
    return this.prisma.defaultCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getDefaultCategory(id: string) {
    const category = await this.prisma.defaultCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('기본 카테고리를 찾을 수 없습니다');
    }

    return category;
  }

  async createDefaultCategory(data: CreateDefaultCategoryDto) {
    try {
      return await this.prisma.defaultCategory.create({
        data: {
          name: data.name,
          color: data.color,
          description: data.description,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      PrismaErrorHandler.handle(error);
    }
  }

  async updateDefaultCategory(id: string, data: UpdateDefaultCategoryDto) {
    try {
      return await this.prisma.defaultCategory.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.color && { color: data.color }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });
    } catch (error) {
      PrismaErrorHandler.handle(error);
    }
  }

  async deleteDefaultCategory(id: string) {
    try {
      return await this.prisma.defaultCategory.delete({
        where: { id },
      });
    } catch (error) {
      PrismaErrorHandler.handle(error);
    }
  }

  async toggleActive(id: string) {
    const category = await this.prisma.defaultCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('기본 카테고리를 찾을 수 없습니다');
    }

    return this.prisma.defaultCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }

  async reorder(dto: ReorderDefaultCategoriesDto) {
    const updates = dto.categories.map(({ id, sortOrder }) =>
      this.prisma.defaultCategory.update({
        where: { id },
        data: { sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.getDefaultCategories();
  }

  async getActiveDefaultCategories() {
    return this.prisma.defaultCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        name: true,
        color: true,
      },
    });
  }
}
