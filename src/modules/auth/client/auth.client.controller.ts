import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientAuthService } from './auth.client.service';
import {
  GoogleNativeLoginDto,
  AppleLoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RefreshResponseDto,
} from './dto/client-auth.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('client - 인증')
@Controller('client/auth')
export class AuthClientController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('google/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '구글 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async googleNativeLogin(@Body() googleLoginDto: GoogleNativeLoginDto) {
    return this.clientAuthService.googleNativeLogin(googleLoginDto);
  }

  @Post('apple/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async appleNativeLogin(@Body() appleLoginDto: AppleLoginDto) {
    return this.clientAuthService.appleLogin(appleLoginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신 (client/auth)' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: '리프레시 토큰 만료 또는 유효하지 않음', type: ErrorResponseDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.clientAuthService.refreshToken(refreshTokenDto.refreshToken);
  }
}

