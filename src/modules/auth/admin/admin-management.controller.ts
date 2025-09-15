import { Controller, Post, Get, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { AdminManagementService } from './admin-management.service';
import { CreateAdminDto } from './dto/admin-management.dto';
import { UserListQueryDto, UserListItemDto } from './dto/user-list.dto';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('admin - 관리자 관리')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Post('admin')
  @RequirePermissions(Permission.CREATE_ADMIN)
  @ApiOperation({ summary: '새 어드민 계정 생성 (슈퍼어드민만)' })
  @ApiResponse({ status: 201, description: '어드민 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminManagementService.createAdmin(createAdminDto);
  }

  @Get()
  @RequirePermissions(Permission.READ_USERS)
  @ApiOperation({ 
    summary: '유저 목록 조회 (페이지네이션 및 검색 지원)',
    description: '모든 유저 목록을 페이지네이션과 함께 조회합니다. 검색, 필터링, 정렬 기능을 지원합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '조회 성공',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '사용자 ID' },
              email: { type: 'string', description: '이메일' },
              name: { type: 'string', nullable: true, description: '이름' },
              nickname: { type: 'string', description: '닉네임' },
              role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], description: '역할' },
              avatarUrl: { type: 'string', nullable: true, description: '프로필 이미지 URL' },
              isStatsPublic: { type: 'boolean', description: '통계 공개 여부' },
              createdAt: { type: 'string', format: 'date-time', description: '생성일' },
              updatedAt: { type: 'string', format: 'date-time', description: '수정일' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', description: '현재 페이지' },
            limit: { type: 'number', description: '페이지당 항목 수' },
            totalItems: { type: 'number', description: '전체 항목 수' },
            totalPages: { type: 'number', description: '전체 페이지 수' },
            hasNext: { type: 'boolean', description: '다음 페이지 존재 여부' },
            hasPrev: { type: 'boolean', description: '이전 페이지 존재 여부' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getUsers(@Query() query: UserListQueryDto) {
    return this.adminManagementService.getUsers(query);
  }

  @Get('admins')
  @RequirePermissions(Permission.READ_USERS)
  @ApiOperation({ summary: '모든 관리자 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getAllAdmins() {
    return this.adminManagementService.getAllAdmins();
  }

  @Delete('admin/:id')
  @RequirePermissions(Permission.DELETE_ADMIN)
  @ApiOperation({ summary: '어드민 계정 삭제 (슈퍼어드민만)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async deleteAdmin(@Param('id') id: string) {
    return this.adminManagementService.deleteAdmin(id);
  }
}
