// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleUser, LoginResponse, LogoutDto, RefreshTokenDto } from './dto/auth.dto';
import { GoogleAuthGuard } from './guards/google.auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google 로그인 시작
  @Get('google')
  @ApiOperation({ summary: 'Google 로그인 시작', description: '사용자를 Google 로그인 페이지로 리다이렉트합니다.' })
  @ApiResponse({ status: 302, description: 'Google 로그인 페이지로 리다이렉트' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // GoogleAuthGuard가 자동으로 Google로 리다이렉트
  }

  // Google 로그인 콜백
  @Get('google/callback')
  @ApiOperation({ summary: 'Google 로그인 콜백', description: 'Google 로그인 성공 후 호출되는 콜백 URL' })
  @ApiResponse({ status: 302, description: '로그인 성공 또는 실패 페이지로 리다이렉트' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Google Strategy에서 검증된 사용자 정보
      const user = req.user as User & { categories: any[] };

      // JWT 토큰 생성
      const tokens = await this.authService.generateTokens(user);

      // 프론트엔드로 리다이렉트 (토큰과 함께)
      const redirectUrl = `http://localhost:19006/auth/success?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      // 에러 발생시 에러 페이지로 리다이렉트
      return res.redirect('http://localhost:19006/auth/error');
    }
  }

  @Post('google/expo')
  @ApiOperation({
    summary: 'Expo Google 로그인',
    description: 'Expo 클라이언트에서 받은 Google Access Token으로 로그인합니다.',
  })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponse })
  @ApiBody({
    description: 'Google Access Token',
    schema: { type: 'object', properties: { accessToken: { type: 'string' } } },
  })
  async googleExpoAuth(@Body() body: { accessToken: string }) {
    try {
      // Google API로 토큰 검증
      const googleUser = await this.authService.verifyGoogleToken(body.accessToken);

      // 사용자 검증 및 JWT 생성
      const user = await this.authService.validateGoogleUser(googleUser);
      const tokens = await this.authService.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  @Post('google/native')
  @ApiOperation({
    summary: 'Native Google 로그인',
    description: 'Native 클라이언트에서 받은 Google 사용자 정보로 로그인합니다.',
  })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponse })
  async googleNativeAuth(@Body() body: { googleId: string; email: string; name: string; photo: string }) {
    try {
      const googleUser: GoogleUser = {
        googleId: body.googleId,
        email: body.email,
        name: body.name,
        picture: body.photo,
      };

      const user = await this.authService.validateGoogleUser(googleUser);
      const tokens = await this.authService.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid Google user data');
    }
  }

  // 토큰 갱신
  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신', description: 'Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공', type: LoginResponse })
  @ApiResponse({ status: 401, description: '유효하지 않은 Refresh Token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  // 내 정보 조회 (인증 필요)
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회', description: '현재 로그인된 사용자의 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '성공', type: LoginResponse })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    return {
      user: req.user,
    };
  }

  // 로그아웃
  @Post('logout')
  @ApiOperation({ summary: '로그아웃', description: '현재 세션을 로그아웃 처리합니다. (Refresh Token 무효화)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Body() logoutDto: LogoutDto) {
    const userId = (req.user as any).id;

    if (logoutDto.refreshToken) {
      await this.authService.revokeRefreshToken(logoutDto.refreshToken, userId);
    }

    return {
      message: '로그아웃되었습니다',
    };
  }

  @Post('test-login')
  @ApiOperation({ summary: '테스트용 로그인 (개발용)', description: '개발 환경에서만 사용 가능한 테스트 로그인' })
  @ApiResponse({ status: 200, description: '성공', type: LoginResponse })
  async testLogin() {
    // 임시 사용자로 토큰 생성 (개발용)
    const testUser = {
      id: 'temp-user-id',
      email: 'test@example.com',
      name: 'Test User',
      nickname: 'testuser',
      avatarUrl: null,
      categories: [], // categories 속성 추가
    };

    return this.authService.generateTokens(testUser as any);
  }
}
