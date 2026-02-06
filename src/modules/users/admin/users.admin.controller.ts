import { Controller, Get, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersAdminService } from './users.admin.service';
import { AdminUserQueryDto, AdminUserListResponseDto, AdminUserResponseDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/enums/permissions.enum';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('admin - 사용자 관리')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Get()
  @RequirePermissions(Permission.READ_USERS)
  @ApiOperation({ summary: '전체 사용자 목록 조회 (어드민)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AdminUserListResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getAllUsers(@Query() queryDto: AdminUserQueryDto) {
    return this.usersAdminService.getAllUsers(queryDto);
  }

  @Get(':id')
  @RequirePermissions(Permission.READ_USERS)
  @ApiOperation({ summary: '사용자 상세 조회 (어드민) - 카테고리, 메모, 캘린더, 설정, 디바이스 포함' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AdminUserResponseDto })
  @ApiResponse({ status: 404, description: '사용자 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async getUserById(@Param('id') id: string) {
    return this.usersAdminService.getUserByIdForAdmin(id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_USERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사용자 삭제 (어드민)' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자 없음', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: '슈퍼어드민 삭제 불가', type: ErrorResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음', type: ErrorResponseDto })
  async deleteUser(@Param('id') id: string) {
    await this.usersAdminService.deleteUserByAdmin(id);
  }
}
