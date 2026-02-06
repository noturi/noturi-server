import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CreateDefaultCategoryDto,
  UpdateDefaultCategoryDto,
  ReorderDefaultCategoriesDto,
  DefaultCategoryResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('admin - 카테고리 관리')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CategoriesAdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @RequirePermissions(Permission.READ_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [DefaultCategoryResponseDto] })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getDefaultCategories() {
    return this.adminService.getDefaultCategories();
  }

  @Get(':id')
  @RequirePermissions(Permission.READ_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: DefaultCategoryResponseDto })
  @ApiResponse({ status: 404, description: '카테고리 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getDefaultCategory(@Param('id') id: string) {
    return this.adminService.getDefaultCategory(id);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 생성' })
  @ApiResponse({ status: 201, description: '생성 성공', type: DefaultCategoryResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: '이미 존재하는 카테고리', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async createDefaultCategory(@Body() createDto: CreateDefaultCategoryDto) {
    return this.adminService.createDefaultCategory(createDto);
  }

  @Patch('reorder')
  @RequirePermissions(Permission.UPDATE_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 순서 변경' })
  @ApiResponse({ status: 200, description: '순서 변경 성공', type: [DefaultCategoryResponseDto] })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async reorder(@Body() reorderDto: ReorderDefaultCategoriesDto) {
    return this.adminService.reorder(reorderDto);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions(Permission.UPDATE_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 활성/비활성 토글' })
  @ApiResponse({ status: 200, description: '토글 성공', type: DefaultCategoryResponseDto })
  @ApiResponse({ status: 404, description: '카테고리 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async toggleActive(@Param('id') id: string) {
    return this.adminService.toggleActive(id);
  }

  @Put(':id')
  @RequirePermissions(Permission.UPDATE_DEFAULT_CATEGORIES)
  @ApiOperation({ summary: '기본 카테고리 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: DefaultCategoryResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '카테고리 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: '이미 존재하는 카테고리명', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async updateDefaultCategory(@Param('id') id: string, @Body() updateDto: UpdateDefaultCategoryDto) {
    return this.adminService.updateDefaultCategory(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_DEFAULT_CATEGORIES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '기본 카테고리 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '카테고리 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async deleteDefaultCategory(@Param('id') id: string) {
    await this.adminService.deleteDefaultCategory(id);
  }
}
