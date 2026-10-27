import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Theme, Language, Prisma } from '@prisma/client';
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

        user = await this.createUserWithDefaults({
          email: oauthUser.email,
          nickname,
          name: oauthUser.name || nickname,
          providers: ['GOOGLE'],
          providerId: oauthUser.providerId,
          avatarUrl: oauthUser.avatarUrl,
        });
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

      const tokens = await this.tokenService.issueSession(user.id);
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

      // 신원(sub/email)은 서명 검증된 토큰 값만 사용 — 바디 값은 위조 가능하므로 이름에만 사용
      const appleId = tokenInfo.providerId;
      const userEmail = tokenInfo.email;
      const userName = appleLoginDto.name || appleLoginDto.fullName;

      if (!appleId) {
        throw new UnauthorizedException('Apple 사용자 정보를 가져올 수 없습니다.');
      }

      // { email: undefined }는 Prisma에서 조건 없음(전체 매칭)이 되므로 값이 있을 때만 조건에 넣는다
      let isNewUser = false;
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [{ providerId: appleId }, ...(userEmail ? [{ email: userEmail }] : [])],
        },
      });

      if (!user && userEmail) {
        isNewUser = true;
        const nickname = await this.generateUniqueNickname(userEmail);

        user = await this.createUserWithDefaults({
          email: userEmail,
          nickname,
          name: userName || nickname,
          providers: ['APPLE'],
          providerId: appleId,
        });
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

      const tokens = await this.tokenService.issueSession(user.id);
      return this.buildAuthResponse(user, tokens, isNewUser);
    } catch (error) {
      this.logger.warn('Apple 로그인 실패');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // 내부 에러 메시지(Prisma 등)는 로그로만 남기고 응답에는 노출하지 않는다
      this.logger.warn(`Apple 로그인 처리 오류: ${error.message}`);
      throw new UnauthorizedException('Apple 로그인에 실패했습니다.');
    }
  }

  /** 리프레시 토큰 회전(RTR) — 사용된 토큰은 무효화되고 같은 세션의 새 토큰 쌍 발급 */
  async refreshToken(refreshToken: string) {
    const tokens = await this.tokenService.rotate(refreshToken);
    return { tokens };
  }

  /** 위젯 전용 세션 발급 — 앱 세션과 별도 family로 회전하므로 서로의 토큰을 무효화하지 않음 */
  async issueWidgetSession(userId: string, appSessionId?: string) {
    const tokens = await this.tokenService.issueWidgetSession(userId, appSessionId);
    return { tokens };
  }

  async logout(userId: string, expoPushToken?: string, sessionId?: string) {
    // 현재 세션(및 그 세션의 위젯 세션) 리프레시 토큰 폐기
    if (sessionId) {
      await this.tokenService.revokeFamily(sessionId);
    }

    if (!expoPushToken) {
      return { success: true };
    }

    await this.prismaService.userDevice.deleteMany({
      where: { userId, expoPushToken },
    });

    const remaining = await this.prismaService.userDevice.count({
      where: { userId },
    });

    if (remaining === 0) {
      await this.prismaService.userSettings.updateMany({
        where: { userId },
        data: { notification: false },
      });
    }

    return { success: true };
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

  /**
   * 사용자 + 기본 카테고리 + 기본 설정을 한 트랜잭션으로 생성
   * (중간에 실패하면 카테고리 없는 계정이 남고, 다음 로그인은 기존 사용자로 처리되어 복구되지 않음)
   */
  private async createUserWithDefaults(data: Prisma.UserCreateInput) {
    const defaultCategories = await this.getDefaultCategories();

    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

      await tx.category.createMany({
        data: defaultCategories.map((category) => ({
          name: category.name,
          color: category.color,
          userId: user.id,
        })),
      });

      await tx.userSettings.create({
        data: {
          userId: user.id,
          theme: Theme.light,
          language: Language.ko,
          notification: false,
        },
      });

      return user;
    });
  }

  private async getDefaultCategories(): Promise<{ name: string; color: string }[]> {
    const activeDefaults = await this.categoriesAdminService.getActiveDefaultCategories();

    // DB에 기본 카테고리가 없는 경우 하드코딩된 기본값 사용
    return activeDefaults.length > 0
      ? activeDefaults
      : [
          { name: '영화', color: '#FF6B6B' },
          { name: '음악', color: '#45B7D1' },
          { name: '책', color: '#4ECDC4' },
        ];
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
        name: user.name ?? '',
        nickname: user.nickname,
        avatarUrl: user.avatarUrl ?? '',
      },
      tokens,
      isNewUser,
    };
  }
}
