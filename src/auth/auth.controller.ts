// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/auth.dto';
import { GoogleAuthGuard } from './guards/google.auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google 로그인 시작
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // GoogleAuthGuard가 자동으로 Google로 리다이렉트
  }

  // Google 로그인 콜백
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Google Strategy에서 검증된 사용자 정보
      const user = req.user;

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

  // 토큰 갱신
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  // 내 정보 조회 (인증 필요)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request) {
    return {
      user: req.user,
    };
  }

  // 로그아웃
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Body() refreshTokenDto: RefreshTokenDto) {
    const userId = (req.user as any).id;

    // 리프레시 토큰 무효화
    await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken, userId);

    return {
      message: '로그아웃되었습니다',
    };
  }

  // 개발용: 테스트 로그인 (실제 배포시 제거)
  @Post('test-login')
  async testLogin() {
    // 임시 사용자로 토큰 생성 (개발용)
    const testUser = {
      id: 'temp-user-id',
      email: 'test@example.com',
      name: 'Test User',
      nickname: 'testuser',
      avatarUrl: null,
    };

    return this.authService.generateTokens(testUser);
  }
}
