import { Controller, Get, Put, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import { UpdateUserDto, ResponseUserDto, UserProfileDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('사용자')
@Controller('client/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersClientController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ResponseUserDto })
  @ApiResponse({ status: 404, description: '사용자 없음', type: ErrorResponseDto })
  async getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.getUserProfile(req.user.id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: '사용자 공개 프로필 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: UserProfileDto })
  @ApiResponse({ status: 404, description: '사용자 없음', type: ErrorResponseDto })
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getPublicUserProfile(id);
  }

  @Put('me')
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ResponseUserDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: '닉네임 중복', type: ErrorResponseDto })
  async updateMyProfile(@Request() req: AuthenticatedRequest, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '계정 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '사용자 없음', type: ErrorResponseDto })
  async deleteMyAccount(@Request() req: AuthenticatedRequest) {
    await this.usersService.deleteUser(req.user.id);
  }
}
