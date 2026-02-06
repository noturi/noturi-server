import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TokenService } from '../token.service';
import { OAuthService } from './oauth.service';
import { AdminService } from '../../categories/admin/admin.service';
import { AppleLoginDto, GoogleNativeLoginDto } from './dto/client-auth.dto';

@Injectable()
export class ClientAuthService {
  private readonly logger = new Logger(ClientAuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
    private readonly oauthService: OAuthService,
    private readonly categoriesAdminService: AdminService,
  ) {}

  async googleNativeLogin(googleLoginDto: GoogleNativeLoginDto) {
    try {
      const oauthUser = await this.oauthService.verifyGoogleToken(googleLoginDto.idToken);

      // 사용자 찾기 또는 생성
      let isNewUser = false;
      let user = await this.prismaService.user.findUnique({
        where: { email: oauthUser.email },
      });

      if (!user) {
        isNewUser = true;
        const nickname = await this.generateUniqueNickname(oauthUser.email);

        user = await this.prismaService.user.create({
          data: {
            email: oauthUser.email,
            nickname,
            name: oauthUser.name || nickname,
            providers: ['GOOGLE'],
            providerId: oauthUser.providerId,
            avatarUrl: oauthUser.avatarUrl,
          },
        });

        await this.createDefaultCategories(user.id);
      } else if (!user.providers.includes('GOOGLE') || user.providerId !== oauthUser.providerId) {
        const updatedProviders = user.providers.includes('GOOGLE')
          ? user.providers
          : [...user.providers, 'GOOGLE' as const];

        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: {
            providers: updatedProviders,
            providerId: oauthUser.providerId,
            avatarUrl: oauthUser.avatarUrl || user.avatarUrl,
          },
        });
      }

      const tokens = this.tokenService.generateTokens(user);
      return this.buildAuthResponse(user, tokens, isNewUser);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google 로그인에 실패했습니다.');
    }
  }

  async appleLogin(appleLoginDto: AppleLoginDto) {
    try {
      const tokenInfo = await this.oauthService.verifyAppleToken(appleLoginDto.idToken);

      // 우선순위: DTO에서 전송된 값 > 토큰에서 추출된 값
      const appleId = appleLoginDto.appleId || appleLoginDto.user || tokenInfo.providerId;
      const userEmail = appleLoginDto.email || tokenInfo.email;
      const userName = appleLoginDto.name || appleLoginDto.fullName;

      if (!userEmail && !appleId) {
        throw new UnauthorizedException('Apple 사용자 정보를 가져올 수 없습니다.');
      }

      let isNewUser = false;
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ providerId: appleId }, { email: userEmail }],
        },
      });

      if (!user && userEmail) {
        isNewUser = true;
        const nickname = await this.generateUniqueNickname(userEmail);

        user = await this.prismaService.user.create({
          data: {
            email: userEmail,
            nickname,
            name: userName || nickname,
            providers: ['APPLE'],
            providerId: appleId,
          },
        });

        await this.createDefaultCategories(user.id);
      } else if (user && !user.providers.includes('APPLE')) {
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

      const tokens = this.tokenService.generateTokens(user);
      return this.buildAuthResponse(user, tokens, isNewUser);
    } catch (error) {
      this.logger.warn('Apple 로그인 실패');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(`Apple 로그인에 실패했습니다: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const tokens = this.tokenService.generateTokens(user);
    return { tokens };
  }

  private async generateUniqueNickname(email: string): Promise<string> {
    const baseNickname = email.split('@')[0];
    let nickname = baseNickname;
    let counter = 1;

    while (await this.prismaService.user.findFirst({ where: { nickname } })) {
      nickname = `${baseNickname}${counter}`;
      counter++;
    }

    return nickname;
  }

  private async createDefaultCategories(userId: string) {
    const activeDefaults = await this.categoriesAdminService.getActiveDefaultCategories();

    // DB에 기본 카테고리가 없는 경우 하드코딩된 기본값 사용
    const categories =
      activeDefaults.length > 0
        ? activeDefaults
        : [
            { name: '영화', color: '#FF6B6B' },
            { name: '음악', color: '#45B7D1' },
            { name: '책', color: '#4ECDC4' },
          ];

    await this.prismaService.category.createMany({
      data: categories.map((category) => ({
        name: category.name,
        color: category.color,
        userId,
      })),
    });
  }

  private buildAuthResponse(
    user: { id: string; email: string; name: string | null; nickname: string; avatarUrl: string | null },
    tokens: { accessToken: string; refreshToken: string },
    isNewUser: boolean,
  ) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
      tokens,
      isNewUser,
    };
  }
}
