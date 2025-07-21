// src/categories/categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
// @UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = req.user.id;
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  findAll(@Request() req) {
    const userId = req.user.id;
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const userId = req.user.id;
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.categoriesService.remove(userId, id);
  }
}
