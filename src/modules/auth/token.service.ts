import { createHash, randomUUID } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { getEnvConfig } from '../../common/config/env.config';

export type ClientType = 'app' | 'widget';

export interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
  /** 세션(토큰 family) ID */
  sid?: string;
  /** 리프레시 토큰 고유 ID — 없으면 RTR 도입 전에 발급된 레거시 토큰 */
  jti?: string;
  /** 레거시 토큰에만 존재 */
  email?: string;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** 회전 직후 같은 토큰의 재요청(네트워크 재시도, 동시 요청)을 정상으로 보는 시간 */
export const REUSE_GRACE_MS = 20_000;

const INVALID_REFRESH = '리프레시 토큰이 만료되었거나 유효하지 않습니다.';

/**
 * 토큰 발급·회전(RTR)·폐기
 *
 * - 리프레시 토큰은 1회용: 사용 시 같은 세션(family)의 새 토큰으로 교체되고 이전 토큰은 rotatedAt 기록
 * - 이미 교체된 토큰이 다시 오면 재사용(탈취 의심) — REFRESH_REUSE_ENFORCE=true면 세션 전체 폐기
 * - DB에는 토큰 원문이 아닌 SHA-256 해시만 저장
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** 새 로그인 세션 시작 */
  async issueSession(
    userId: string,
    options: { clientType?: ClientType; parentFamilyId?: string } = {},
  ): Promise<TokenPair> {
    return this.issueTokens(userId, randomUUID(), options);
  }

  /** 리프레시 토큰으로 새 토큰 쌍 발급 (회전) */
  async rotate(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefreshJwt(refreshToken);

    const tokenHash = hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { token: tokenHash } });

    // RTR 도입 전 토큰(jti 없음): 처음 쓰일 때 "사용됨" 행을 남기고 새 세션으로 이전 (배포 시 강제 로그아웃 방지)
    // 행이 남으므로 같은 레거시 토큰의 두 번째 사용부터는 일반 토큰과 같은 재사용 감지를 받음
    if (!payload.jti && !record) {
      await this.assertUserExists(payload.sub);
      const familyId = randomUUID();
      await this.prisma.refreshToken.create({
        data: {
          token: tokenHash,
          userId: payload.sub,
          familyId,
          expiresAt: new Date((payload.exp ?? 0) * 1000),
          rotatedAt: new Date(),
        },
      });
      return this.issueTokens(payload.sub, familyId, {});
    }

    if (!record || record.userId !== payload.sub || record.revokedAt) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    // 원자적으로 "아직 회전되지 않은 토큰"만 회전 처리 — 동시 요청 중 하나만 통과
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, rotatedAt: null, revokedAt: null },
      data: { rotatedAt: new Date() },
    });

    if (claimed.count === 0) {
      await this.handleReuse(record.id);
    }

    await this.assertUserExists(record.userId);
    return this.issueTokens(record.userId, record.familyId, {
      clientType: record.clientType as ClientType,
      parentFamilyId: record.parentFamilyId ?? undefined,
    });
  }

  /** 이미 회전된 토큰이 다시 사용됨 — 유예 시간 내면 정상, 아니면 탈취 의심 */
  private async handleReuse(recordId: string): Promise<void> {
    const record = await this.prisma.refreshToken.findUnique({ where: { id: recordId } });
    if (!record || record.revokedAt) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    const elapsed = record.rotatedAt ? Date.now() - record.rotatedAt.getTime() : Infinity;
    if (elapsed <= REUSE_GRACE_MS) {
      return;
    }

    const context = { userId: record.userId, familyId: record.familyId, clientType: record.clientType };
    Sentry.captureMessage('리프레시 토큰 재사용 감지', { level: 'warning', extra: context });

    if (!getEnvConfig().REFRESH_REUSE_ENFORCE) {
      // 이행 기간: 구버전 앱(앱·위젯이 같은 토큰 공유)은 정상적으로 재사용하므로 기록만 하고 허용
      this.logger.warn(`리프레시 토큰 재사용 감지(기록 모드) ${JSON.stringify(context)}`);
      return;
    }

    this.logger.warn(`리프레시 토큰 재사용 감지 — 세션 폐기 ${JSON.stringify(context)}`);
    await this.revokeFamily(record.familyId);
    throw new UnauthorizedException(INVALID_REFRESH);
  }

  /** 세션과 그 세션이 발급한 위젯 세션까지 폐기 */
  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        OR: [{ familyId }, { parentFamilyId: familyId }],
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /** 앱 세션에 연결된 기존 위젯 세션을 폐기하고 새 위젯 세션 발급 */
  async issueWidgetSession(userId: string, appSessionId?: string): Promise<TokenPair> {
    if (appSessionId) {
      await this.prisma.refreshToken.updateMany({
        where: { parentFamilyId: appSessionId, clientType: 'widget', revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return this.issueSession(userId, { clientType: 'widget', parentFamilyId: appSessionId });
  }

  /** 만료된 토큰 행 정리 (만료 전까지는 재사용 감지를 위해 보관) */
  async deleteExpired(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }

  private async issueTokens(
    userId: string,
    familyId: string,
    options: { clientType?: ClientType; parentFamilyId?: string },
  ): Promise<TokenPair> {
    const env = getEnvConfig();

    const accessToken = this.jwtService.sign({ sub: userId, sid: familyId, type: 'access' });
    const refreshToken = this.jwtService.sign(
      { sub: userId, sid: familyId, type: 'refresh', jti: randomUUID() },
      { secret: env.REFRESH_TOKEN_SECRET, expiresIn: env.REFRESH_TOKEN_EXPIRES_IN },
    );

    const { exp } = this.jwtService.decode<TokenPayload>(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId,
        familyId,
        parentFamilyId: options.parentFamilyId,
        clientType: options.clientType ?? 'app',
        expiresAt: new Date((exp ?? 0) * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /** 서명·만료·타입 검증. 레거시 토큰은 JWT_SECRET으로 서명되어 있으므로 함께 확인 */
  private verifyRefreshJwt(token: string): TokenPayload {
    const env = getEnvConfig();
    const secrets = [...new Set([env.REFRESH_TOKEN_SECRET, env.JWT_SECRET])];

    for (const secret of secrets) {
      try {
        const payload = this.jwtService.verify<TokenPayload>(token, { secret });
        if (payload.type !== 'refresh') break;
        // 리프레시 전용 키를 쓰는 경우, JWT_SECRET 서명은 레거시(jti 없음)만 허용
        if (secret !== env.REFRESH_TOKEN_SECRET && payload.jti) break;
        return payload;
      } catch {
        // 다음 키로 재시도
      }
    }
    throw new UnauthorizedException(INVALID_REFRESH);
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
