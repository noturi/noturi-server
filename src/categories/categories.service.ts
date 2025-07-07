// src/categories/categories.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// 시드된 고정 사용자 ID (UUID)
const SEED_USER_ID = '110caecb-8727-414d-aa0c-667fa639518c';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 모든 카테고리 조회 (시드한 고정 사용자용) */
  async findAll(): Promise<{ id: string; name: string }[]> {
    return this.prisma.category.findMany({
      where: { userId: SEED_USER_ID },
      select: { id: true, name: true },
    });
  }

  /** 단일 카테고리 조회 */
  async findOne(id: string): Promise<{ id: string; name: string }> {
    const cat = await this.prisma.category.findFirst({
      where: { id, userId: SEED_USER_ID },
      select: { id: true, name: true },
    });
    if (!cat) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return cat;
  }

  /** 카테고리 생성 */
  async create(dto: CreateCategoryDto): Promise<{ id: string; name: string }> {
    return this.prisma.category.create({
      data: { name: dto.name, userId: SEED_USER_ID },
      select: { id: true, name: true },
    });
  }

  /** 카테고리 수정 */
  async update(id: string, dto: UpdateCategoryDto): Promise<{ id: string; name: string }> {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
      select: { id: true, name: true },
    });
  }

  /** 카테고리 삭제 */
  async remove(id: string): Promise<{ id: string; name: string }> {
    await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
      select: { id: true, name: true },
    });
  }
}
