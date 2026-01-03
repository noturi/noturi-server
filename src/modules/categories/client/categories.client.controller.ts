// src/categories/categories.controller.ts
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { CategoriesService } from '../categories.service';
import { CategoryDto, CreateCategoryDto, ReorderCategoriesDto, UpdateCategoryDto } from './dto';

@ApiTags('client - 카테고리')
@ApiBearerAuth()
@Controller('client/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesClientController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '새 카테고리 생성', description: '새로운 카테고리를 생성합니다.' })
  @ApiResponse({ status: 201, description: '카테고리 생성 성공', type: CategoryDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({
    status: 409,
    description: '중복된 카테고리 이름 (code: 4091) 또는 최대 개수 초과 (code: 4093)',
    type: ErrorResponseDto,
  })
  create(@Request() req: AuthenticatedRequest, @Body() createCategoryDto: CreateCategoryDto) {
    const userId = req.user.id;
    return this.categoriesService.create(userId, createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: '모든 카테고리 조회', description: '사용자의 모든 카테고리를 조회합니다.' })
  @ApiResponse({ status: 200, description: '카테고리 목록 조회 성공', type: [CategoryDto] })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  findAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.categoriesService.findAll(userId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: '카테고리 순서 변경', description: '카테고리들의 순서를 변경합니다.' })
  @ApiResponse({ status: 200, description: '순서 변경 성공', type: [CategoryDto] })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  reorder(@Request() req: AuthenticatedRequest, @Body() reorderDto: ReorderCategoriesDto) {
    const userId = req.user.id;
    return this.categoriesService.reorder(userId, reorderDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 카테고리 조회', description: 'ID로 특정 카테고리를 조회합니다.' })
  @ApiResponse({ status: 200, description: '카테고리 조회 성공', type: CategoryDto })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '카테고리 수정', description: 'ID로 특정 카테고리를 수정합니다.' })
  @ApiResponse({ status: 200, description: '카테고리 수정 성공', type: CategoryDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '중복된 카테고리 이름 (code: 4091)', type: ErrorResponseDto })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const userId = req.user.id;
    return this.categoriesService.update(userId, id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '카테고리 삭제', description: 'ID로 특정 카테고리를 삭제합니다.' })
  @ApiParam({ name: 'id', description: '카테고리 ID (UUID v4)', required: true })
  @ApiResponse({ status: 200, description: '카테고리 삭제 성공', type: CategoryDto })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '카테고리를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '메모가 있는 카테고리는 삭제 불가 (code: 4092)', type: ErrorResponseDto })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.categoriesService.remove(userId, id);
  }
}
