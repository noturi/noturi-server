// src/categories/categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    const userId = this.getCurrentUserId(); // 임시
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  findAll() {
    const userId = this.getCurrentUserId(); // 임시
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    const userId = this.getCurrentUserId(); // 임시
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const userId = this.getCurrentUserId(); // 임시
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    const userId = this.getCurrentUserId(); // 임시
    return this.categoriesService.remove(userId, id);
  }

  // 임시로 하드코딩된 사용자 ID (나중에 Auth에서 가져올 예정)
  private getCurrentUserId(): string {
    return 'temp-user-id';
  }
}
