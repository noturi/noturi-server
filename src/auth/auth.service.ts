// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { GoogleUser, JwtPayload, LoginResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Google 사용자 검증 및 처리
  async validateGoogleUser(googleUser: GoogleUser) {
    // 기존 사용자 찾기
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: googleUser.email }, { providerId: googleUser.googleId, provider: 'GOOGLE' }],
      },
    });

    if (!user) {
      // 새 사용자 생성
      user = await this.createGoogleUser(googleUser);
    } else {
      // 기존 사용자 정보 업데이트
      user = await this.updateGoogleUser(user.id, googleUser);
    }

    return user;
  }

  // 새 Google 사용자 생성
  private async createGoogleUser(googleUser: GoogleUser) {
    // 고유한 닉네임 생성
    const nickname = await this.generateUniqueNickname(googleUser.name);

    return this.prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        nickname,
        provider: 'GOOGLE',
        providerId: googleUser.googleId,
        avatarUrl: googleUser.picture,
      },
    });
  }

  async verifyGoogleToken(accessToken: string): Promise<GoogleUser> {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);
      const googleUserData = await response.json();

      if (!response.ok) {
        throw new Error('Invalid Google token');
      }

      return {
        googleId: googleUserData.id,
        email: googleUserData.email,
        name: googleUserData.name,
        picture: googleUserData.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Google token verification failed');
    }
  }

  // 기존 Google 사용자 정보 업데이트
  private async updateGoogleUser(userId: string, googleUser: GoogleUser) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      },
    });
  }

  // 고유 닉네임 생성
  private async generateUniqueNickname(name: string): Promise<string> {
    const baseNickname = name.replace(/\s+/g, '').toLowerCase();
    let nickname = baseNickname;
    let counter = 1;

    while (await this.prisma.user.findUnique({ where: { nickname } })) {
      nickname = `${baseNickname}${counter}`;
      counter++;
    }

    return nickname;
  }

  // JWT 토큰 생성
  async generateTokens(user: any): Promise<LoginResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }),
    ]);

    // 리프레시 토큰 DB에 저장
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // 리프레시 토큰으로 새 액세스 토큰 발급
  async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    try {
      // 토큰 검증
      const payload = this.jwtService.verify(refreshToken);

      // DB에서 리프레시 토큰 확인
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!storedToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      }

      // 기존 토큰 무효화
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // 새 토큰 발급
      return this.generateTokens(storedToken.user);
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  // 리프레시 토큰 무효화
  async revokeRefreshToken(refreshToken: string, userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // 사용자의 모든 리프레시 토큰 무효화 (전체 로그아웃)
  async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
