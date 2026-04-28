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
    const appleClientId = process.env.APPLE_CLIENT_ID;
    let tokenContext: Record<string, unknown> = {};

    try {
      // JWT 헤더에서 kid 추출
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.header?.kid) {
        this.logger.warn('[Apple verify] decode 실패 또는 kid 없음', {
          hasDecoded: !!decoded,
          header: decoded?.header,
        });
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      // 토큰 컨텍스트 수집 (검증 전 디버깅용)
      const rawPayload = decoded.payload as jwt.JwtPayload;
      const subTail = typeof rawPayload?.sub === 'string' ? rawPayload.sub.slice(-6) : null;
      const emailDomain =
        typeof rawPayload?.email === 'string' ? (rawPayload.email as string).split('@')[1] : null;
      tokenContext = {
        kid: decoded.header.kid,
        alg: decoded.header.alg,
        iss: rawPayload?.iss,
        aud: rawPayload?.aud,
        sub_tail: subTail,
        email_domain: emailDomain,
        iat: rawPayload?.iat,
        exp: rawPayload?.exp,
        now: Math.floor(Date.now() / 1000),
        expected_aud: appleClientId,
      };

      this.logger.log('[Apple verify] 시작', tokenContext);

      // Apple JWKS에서 공개키 가져오기
      const publicKey = await this.getApplePublicKey(decoded.header.kid);

      // JWT 서명 검증 + 클레임 검증
      const payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: appleClientId,
      }) as jwt.JwtPayload;

      if (!payload.sub) {
        this.logger.warn('[Apple verify] payload에 sub 없음', tokenContext);
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      this.logger.log('[Apple verify] 성공', { sub_tail: payload.sub.slice(-6) });

      return {
        providerId: payload.sub,
        email: payload.email as string | undefined,
        provider: 'APPLE',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const err = error as Error;
      this.logger.warn(`[Apple verify] 실패`, {
        ...tokenContext,
        errorName: err.name,
        errorMessage: err.message,
      });
      throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
    }
  }

  // Apple JWKS에서 kid에 맞는 공개키를 PEM 형식으로 반환
  private async getApplePublicKey(kid: string): Promise<string> {
    const jwks = await this.fetchAppleJWKS();
    const matchingKey = (jwks as any[]).find((key: any) => key.kid === kid);
    if (!matchingKey) {
      const availableKids = (jwks as any[]).map((k: any) => k.kid);
      this.logger.warn('[Apple verify] kid 매칭 실패', {
        requestedKid: kid,
        availableKids,
      });
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
