import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './auth.admin.service';
import { AdminLoginDto, AdminRegisterDto } from './dto';
import { AuthErrorResponseDto } from './dto/auth-error-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('admin - 인증')
@Controller('admin/auth')
export class AuthAdminController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: '어드민 계정 등록 (SUPER_ADMIN 전용)' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 401, description: '인증 필요', type: AuthErrorResponseDto })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 권한 필요', type: AuthErrorResponseDto })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일', type: AuthErrorResponseDto })
  async adminRegister(@CurrentUser() user: any, @Body() adminRegisterDto: AdminRegisterDto) {
    return this.adminAuthService.registerAdmin(adminRegisterDto, user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: AuthErrorResponseDto })
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminAuthService.loginAdmin(adminLoginDto);
  }
}
