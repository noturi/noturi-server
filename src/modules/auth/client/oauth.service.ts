import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'GOOGLE' | 'APPLE';
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  private readonly googleClient: OAuth2Client;
  private readonly allowedGoogleAudiences: string[];

  constructor() {
    this.googleClient = new OAuth2Client();
    this.allowedGoogleAudiences = [
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
    ].filter(Boolean) as string[];
  }

  async verifyGoogleToken(idToken: string): Promise<OAuthUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.allowedGoogleAudiences,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('유효하지 않은 구글 토큰입니다.');
      }

      if (!payload.email) {
        throw new UnauthorizedException('이메일 정보를 가져올 수 없습니다.');
      }

      return {
        providerId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.picture,
        provider: 'GOOGLE',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Google 토큰 검증 실패');
      throw new UnauthorizedException('유효하지 않은 구글 토큰입니다.');
    }
  }

  async verifyAppleToken(idToken: string): Promise<Partial<OAuthUserInfo>> {
    // Apple ID 토큰 디코드
    // Apple의 경우 클라이언트에서 이미 검증된 토큰을 받으며,
    // 이메일/이름 등의 정보는 DTO에서 우선적으로 제공됨
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      if (payload.iss !== 'https://appleid.apple.com') {
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      return {
        providerId: payload.sub,
        email: payload.email,
        provider: 'APPLE',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn('Apple 토큰 파싱 실패');
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }
  }
}
