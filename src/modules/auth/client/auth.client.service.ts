import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../../../prisma/prisma.service';
import { getEnvConfig } from '../../../common/config/env.config';
import { AppleLoginDto, GoogleNativeLoginDto } from './dto/client-auth.dto';

@Injectable()
export class ClientAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async googleNativeLogin(googleLoginDto: GoogleNativeLoginDto) {
    try {
      // 네이티브 앱에서 이미 검증된 토큰을 받으므로 디코드만 진행
      const decodedToken = jwt.decode(googleLoginDto.idToken) as any;

      if (!decodedToken) {
        throw new UnauthorizedException('유효하지 않은 구글 토큰입니다.');
      }

      const { sub: googleId, email, name, picture } = decodedToken;

      if (!email) {
        throw new UnauthorizedException('이메일 정보를 가져올 수 없습니다.');
      }

      // 사용자 찾기 또는 생성
      let isNewUser = false;
      let user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (!user) {
        isNewUser = true;

        // 닉네임 중복 처리
        const baseNickname = email.split('@')[0];
        let nickname = baseNickname;
        let counter = 1;

        // 닉네임이 중복되지 않을 때까지 반복
        while (await this.prismaService.user.findFirst({ where: { nickname } })) {
          nickname = `${baseNickname}${counter}`;
          counter++;
        }

        user = await this.prismaService.user.create({
          data: {
            email,
            nickname: nickname,
            name: name || nickname,
            providers: ['GOOGLE'],
            providerId: googleId,
            avatarUrl: picture,
          },
        });

        // 신규 회원에게 기본 카테고리 생성
        await this.createDefaultCategories(user.id);
      } else if (!user.providers.includes('GOOGLE') || user.providerId !== googleId) {
        // 기존 사용자에 Google 정보 추가
        const updatedProviders = user.providers.includes('GOOGLE')
          ? user.providers
          : [...user.providers, 'GOOGLE' as const];

        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            providers: updatedProviders,
            providerId: googleId,
            avatarUrl: picture || user.avatarUrl,
          },
        });
      }

      // JWT 토큰 생성
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        type: 'access',
      });

      const refreshToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'refresh',
        },
        { expiresIn: getEnvConfig().REFRESH_TOKEN_EXPIRES_IN },
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        isNewUser,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google 로그인에 실패했습니다.');
    }
  }

  async appleLogin(appleLoginDto: AppleLoginDto) {
    try {
      // Apple ID 토큰 디코드 (검증 없이)
      const decodedToken = jwt.decode(appleLoginDto.idToken) as any;
      if (!decodedToken) {
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      const { sub: tokenAppleId, email: tokenEmail } = decodedToken;

      // 우선순위: DTO에서 전송된 값 > 토큰에서 추출된 값
      const appleId = appleLoginDto.appleId || appleLoginDto.user || tokenAppleId;
      const userEmail = appleLoginDto.email || tokenEmail;
      const userName = appleLoginDto.name || appleLoginDto.fullName;

      if (!userEmail && !appleId) {
        throw new UnauthorizedException('Apple 사용자 정보를 가져올 수 없습니다.');
      }

      // Apple ID로 사용자 찾기
      let isNewUser = false;
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ providerId: appleId }, { email: userEmail }],
        },
      });

      if (!user && userEmail) {
        isNewUser = true;

        // 새 사용자 생성 - 닉네임 중복 처리
        const baseNickname = userEmail.split('@')[0];
        let nickname = baseNickname;
        let counter = 1;

        // 닉네임이 중복되지 않을 때까지 반복
        while (await this.prismaService.user.findFirst({ where: { nickname } })) {
          nickname = `${baseNickname}${counter}`;
          counter++;
        }

        user = await this.prismaService.user.create({
          data: {
            email: userEmail,
            nickname: nickname,
            name: userName || nickname,
            providers: ['APPLE'],
            providerId: appleId,
          },
        });

        // 신규 회원에게 기본 카테고리 생성
        await this.createDefaultCategories(user.id);
      } else if (user && !user.providers.includes('APPLE')) {
        // 기존 사용자에 Apple 정보 추가
        const updatedProviders = [...user.providers, 'APPLE' as const];

        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            providers: updatedProviders,
            providerId: appleId,
          },
        });
      }

      if (!user) {
        throw new UnauthorizedException('사용자를 찾거나 생성할 수 없습니다.');
      }

      // JWT 토큰 생성
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        type: 'access',
      });

      const refreshToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'refresh',
        },
        { expiresIn: getEnvConfig().REFRESH_TOKEN_EXPIRES_IN },
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        isNewUser,
      };
    } catch (error) {
      console.error('Apple 로그인 에러:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Apple 로그인에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 리프레시 토큰으로 새 액세스 토큰 발급
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새 액세스 토큰 생성
      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        type: 'access',
      });

      // 새 리프레시 토큰 생성 (토큰 로테이션)
      const newRefreshToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'refresh',
        },
        { expiresIn: getEnvConfig().REFRESH_TOKEN_EXPIRES_IN },
      );

      return {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('리프레시 토큰이 만료되었거나 유효하지 않습니다.');
    }
  }

  /**
   * 신규 회원에게 기본 카테고리 생성 (영화, 음악, 책)
   */
  private async createDefaultCategories(userId: string) {
    const defaultCategories = [
      { name: '영화', color: '#FF6B6B' },
      { name: '음악', color: '#45B7D1' },
      { name: '책', color: '#4ECDC4' },
    ];

    await this.prismaService.category.createMany({
      data: defaultCategories.map((category) => ({
        ...category,
        userId,
      })),
    });
  }
}
