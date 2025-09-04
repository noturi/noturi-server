import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminAuthService } from './auth.admin.service';
import { AdminLoginDto, AdminRegisterDto } from './dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('admin - 인증')
@Controller('admin/auth')
export class AuthAdminController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  @ApiOperation({ summary: '어드민 계정 등록' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일', type: ErrorResponseDto })
  async adminRegister(@Body() adminRegisterDto: AdminRegisterDto) {
    return this.adminAuthService.registerAdmin(adminRegisterDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.adminAuthService.loginAdmin(adminLoginDto);
  }
}
