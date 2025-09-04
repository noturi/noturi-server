import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClientAuthService } from './auth.client.service';
import { GoogleNativeLoginDto, AppleLoginDto } from './dto/client-auth.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('클라이언트 인증')
@Controller('client/auth')
export class AuthClientController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('google/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '구글 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async googleNativeLogin(@Body() googleLoginDto: GoogleNativeLoginDto) {
    return this.clientAuthService.googleNativeLogin(googleLoginDto);
  }

  @Post('apple/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async appleNativeLogin(@Body() appleLoginDto: AppleLoginDto) {
    return this.clientAuthService.appleLogin(appleLoginDto);
  }
}

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('google/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '구글 네이티브 로그인 (legacy)' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async googleNativeLoginLegacy(@Body() googleLoginDto: GoogleNativeLoginDto) {
    return this.clientAuthService.googleNativeLogin(googleLoginDto);
  }

  @Post('apple/native')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '애플 네이티브 로그인 (legacy)' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async appleNativeLoginLegacy(@Body() appleLoginDto: AppleLoginDto) {
    return this.clientAuthService.appleLogin(appleLoginDto);
  }
}