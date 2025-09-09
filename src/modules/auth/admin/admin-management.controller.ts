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
  @ApiOperation({ summary: '유저 목록 조회 (페이지네이션 및 검색 지원)' })
  @ApiResponse({ 
    status: 200, 
    description: '조회 성공',
    type: PaginatedResponseDto<UserListItemDto>
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
