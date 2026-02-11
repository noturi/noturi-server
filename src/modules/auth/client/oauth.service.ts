import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import * as jose from 'node-jose';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  provider: 'GOOGLE' | 'APPLE';
}

interface AppleJWKS {
  keys: jose.JWK.Key[];
  fetchedAt: number;
}

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const JWKS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  private readonly googleClient: OAuth2Client;
  private readonly allowedGoogleAudiences: string[];
  private appleJwksCache: AppleJWKS | null = null;

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
    try {
      // JWT 헤더에서 kid 추출
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.header?.kid) {
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      // Apple JWKS에서 공개키 가져오기
      const publicKey = await this.getApplePublicKey(decoded.header.kid);

      // JWT 서명 검증 + 클레임 검증
      const appleClientId = process.env.APPLE_CLIENT_ID;
      const payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: appleClientId,
      }) as jwt.JwtPayload;

      if (!payload.sub) {
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      return {
        providerId: payload.sub,
        email: payload.email as string | undefined,
        provider: 'APPLE',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`Apple 토큰 검증 실패: ${(error as Error).message}`);
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }
  }

  // Apple JWKS에서 kid에 맞는 공개키를 PEM 형식으로 반환
  private async getApplePublicKey(kid: string): Promise<string> {
    const jwks = await this.fetchAppleJWKS();
    const matchingKey = (jwks as any[]).find((key: any) => key.kid === kid);
    if (!matchingKey) {
      throw new UnauthorizedException('Apple 공개키를 찾을 수 없습니다.');
    }

    const key = await jose.JWK.asKey(matchingKey);
    return key.toPEM();
  }

  // Apple JWKS 가져오기 (캐시 적용)
  private async fetchAppleJWKS(): Promise<any[]> {
    if (this.appleJwksCache && Date.now() - this.appleJwksCache.fetchedAt < JWKS_CACHE_TTL) {
      return this.appleJwksCache.keys as any[];
    }

    const response = await fetch(APPLE_JWKS_URL);
    if (!response.ok) {
      throw new UnauthorizedException('Apple JWKS를 가져올 수 없습니다.');
    }

    const data = await response.json();
    this.appleJwksCache = {
      keys: data.keys,
      fetchedAt: Date.now(),
    };

    return data.keys;
  }
}
