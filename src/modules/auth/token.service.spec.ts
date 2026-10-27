import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as Sentry from '@sentry/nestjs';
import { REUSE_GRACE_MS, TokenService, hashToken } from './token.service';

jest.mock('@sentry/nestjs', () => ({ captureMessage: jest.fn() }));

const JWT_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';
const USER_ID = 'user-1';

interface Row {
  id: string;
  token: string;
  userId: string;
  familyId: string;
  parentFamilyId: string | null;
  clientType: string;
  expiresAt: Date;
  rotatedAt: Date | null;
  revokedAt: Date | null;
}

/** refresh_tokens 테이블의 메모리 구현 — TokenService가 쓰는 쿼리 형태만 지원 */
function createFakePrisma() {
  const rows: Row[] = [];
  let seq = 0;

  const matches = (row: Row, where: Record<string, unknown>): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key === 'OR') return (value as Record<string, unknown>[]).some((w) => matches(row, w));
      if (value && typeof value === 'object' && 'lt' in value) {
        return (row[key as keyof Row] as Date) < (value as { lt: Date }).lt;
      }
      return row[key as keyof Row] === value;
    });

  const refreshToken = {
    findUnique: jest.fn(async ({ where }) => rows.find((r) => matches(r, where)) ?? null),
    create: jest.fn(async ({ data }) => {
      const row: Row = {
        id: `rt-${++seq}`,
        parentFamilyId: null,
        clientType: 'app',
        rotatedAt: null,
        revokedAt: null,
        ...data,
      };
      rows.push(row);
      return row;
    }),
    updateMany: jest.fn(async ({ where, data }) => {
      const targets = rows.filter((r) => matches(r, where));
      targets.forEach((r) => Object.assign(r, data));
      return { count: targets.length };
    }),
    deleteMany: jest.fn(async ({ where }) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], where)) rows.splice(i, 1);
      return { count: before - rows.length };
    }),
  };

  const users = new Set([USER_ID]);
  const user = {
    findUnique: jest.fn(async ({ where }) => (users.has(where.id) ? { id: where.id } : null)),
  };

  return { prisma: { refreshToken, user }, rows, users };
}

function setup() {
  const fake = createFakePrisma();
  const jwt = new JwtService({ secret: JWT_SECRET, signOptions: { expiresIn: '15m' } });
  const service = new TokenService(jwt, fake.prisma as any);
  return { service, jwt, ...fake };
}

const expectUnauthorized = (promise: Promise<unknown>) => expect(promise).rejects.toBeInstanceOf(UnauthorizedException);

const NOW = new Date('2026-10-27T00:00:00Z').getTime();

beforeEach(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.REFRESH_TOKEN_SECRET = REFRESH_SECRET;
  process.env.GOOGLE_CLIENT_ID = 'test';
  process.env.DATABASE_URL = 'postgres://test';
  delete process.env.REFRESH_REUSE_ENFORCE;
  jest.useFakeTimers({ now: NOW });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

const advance = (ms: number) => jest.setSystemTime(Date.now() + ms);

describe('TokenService 발급', () => {
  it('DB에는 토큰 원문이 아닌 해시만 저장하고, 토큰에 이메일을 넣지 않는다', async () => {
    const { service, rows, jwt } = setup();
    const { accessToken, refreshToken } = await service.issueSession(USER_ID);

    expect(rows).toHaveLength(1);
    expect(rows[0].token).toBe(hashToken(refreshToken));
    expect(rows[0].token).not.toBe(refreshToken);

    const access = jwt.decode(accessToken);
    const refresh = jwt.decode(refreshToken);
    expect(access).toMatchObject({ sub: USER_ID, type: 'access', sid: rows[0].familyId });
    expect(refresh).toMatchObject({ sub: USER_ID, type: 'refresh', sid: rows[0].familyId });
    expect(refresh.jti).toBeDefined();
    expect(access.email).toBeUndefined();
  });

  it('리프레시 토큰은 전용 키로 서명되어 액세스 토큰 키로는 검증되지 않는다', async () => {
    const { service, jwt } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);

    expect(() => jwt.verify(refreshToken, { secret: JWT_SECRET })).toThrow();
    expect(() => jwt.verify(refreshToken, { secret: REFRESH_SECRET })).not.toThrow();
  });
});

describe('TokenService 회전(RTR)', () => {
  it('같은 세션의 새 토큰 쌍을 발급하고 사용한 토큰은 회전 처리한다', async () => {
    const { service, rows, jwt } = setup();
    const first = await service.issueSession(USER_ID);
    const second = await service.rotate(first.refreshToken);

    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(jwt.decode(second.refreshToken).sid).toBe(jwt.decode(first.refreshToken).sid);
    expect(rows[0].rotatedAt).not.toBeNull();
    expect(rows[1].rotatedAt).toBeNull();
  });

  it('유예 시간 내 같은 토큰 재요청(네트워크 재시도)은 정상으로 처리한다', async () => {
    const { service } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);
    await service.rotate(refreshToken);

    advance(REUSE_GRACE_MS - 1000);
    await expect(service.rotate(refreshToken)).resolves.toHaveProperty('refreshToken');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('동시에 같은 토큰으로 두 번 요청해도 둘 다 성공한다 (원자적 회전 + 유예)', async () => {
    const { service } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);

    const results = await Promise.all([service.rotate(refreshToken), service.rotate(refreshToken)]);
    expect(results.every((r) => r.refreshToken)).toBe(true);
  });

  it('[기록 모드] 유예 이후 재사용은 Sentry에 기록하고 허용한다 (구버전 앱 이행 기간)', async () => {
    const { service } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);
    await service.rotate(refreshToken);

    advance(REUSE_GRACE_MS + 1000);
    await expect(service.rotate(refreshToken)).resolves.toHaveProperty('refreshToken');
    expect(Sentry.captureMessage).toHaveBeenCalledWith('리프레시 토큰 재사용 감지', expect.anything());
  });

  it('[강제 모드] 유예 이후 재사용은 세션 전체를 폐기한다 — 정상 사용자의 최신 토큰도 무효화', async () => {
    process.env.REFRESH_REUSE_ENFORCE = 'true';
    const { service, rows } = setup();
    const stolen = (await service.issueSession(USER_ID)).refreshToken;
    const latest = (await service.rotate(stolen)).refreshToken;

    advance(REUSE_GRACE_MS + 1000);
    await expectUnauthorized(service.rotate(stolen));

    expect(rows.every((r) => r.revokedAt)).toBe(true);
    await expectUnauthorized(service.rotate(latest));
  });

  it('폐기된 세션의 토큰은 거부한다', async () => {
    const { service, jwt } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);
    await service.revokeFamily(jwt.decode(refreshToken).sid);

    await expectUnauthorized(service.rotate(refreshToken));
  });

  it('DB에 없는 토큰, 액세스 토큰, 잘못 서명된 토큰은 거부한다', async () => {
    const { service, jwt } = setup();
    const { accessToken } = await service.issueSession(USER_ID);
    const unknown = jwt.sign({ sub: USER_ID, type: 'refresh', jti: 'x', sid: 'y' }, { secret: REFRESH_SECRET });
    const forged = jwt.sign({ sub: USER_ID, type: 'refresh', jti: 'x' }, { secret: 'attacker' });

    await expectUnauthorized(service.rotate(unknown));
    await expectUnauthorized(service.rotate(accessToken));
    await expectUnauthorized(service.rotate(forged));
  });

  it('탈퇴한 사용자의 토큰은 거부한다', async () => {
    const { service, users } = setup();
    const { refreshToken } = await service.issueSession(USER_ID);
    users.delete(USER_ID);

    await expectUnauthorized(service.rotate(refreshToken));
  });
});

describe('TokenService 레거시 토큰 이전', () => {
  /** RTR 도입 전 형식: JWT_SECRET 서명, jti/sid 없음, email 포함 */
  const legacyToken = (jwt: JwtService) =>
    jwt.sign({ sub: USER_ID, email: 'a@b.c', type: 'refresh' }, { secret: JWT_SECRET, expiresIn: '30d' });

  it('처음 사용 시 새 세션으로 이전한다 (배포 시 강제 로그아웃 없음)', async () => {
    const { service, jwt } = setup();
    const next = await service.rotate(legacyToken(jwt));

    expect(jwt.decode(next.refreshToken)).toMatchObject({ type: 'refresh', sid: expect.any(String) });
    expect(jwt.decode(next.refreshToken).jti).toBeDefined();
  });

  it('[강제 모드] 같은 레거시 토큰의 재사용은 일반 토큰과 같이 세션을 폐기한다', async () => {
    process.env.REFRESH_REUSE_ENFORCE = 'true';
    const { service, jwt } = setup();
    const legacy = legacyToken(jwt);
    await service.rotate(legacy);

    advance(REUSE_GRACE_MS + 1000);
    await expectUnauthorized(service.rotate(legacy));
  });

  it('JWT_SECRET으로 서명된 새 형식(jti 있음) 토큰은 거부한다 — 리프레시 전용 키 우회 방지', async () => {
    const { service, jwt } = setup();
    const token = jwt.sign({ sub: USER_ID, type: 'refresh', jti: 'x', sid: 'y' }, { secret: JWT_SECRET });

    await expectUnauthorized(service.rotate(token));
  });
});

describe('TokenService 위젯 세션', () => {
  it('앱 세션과 별도 세션으로 발급되어 서로 독립적으로 회전한다', async () => {
    const { service, jwt } = setup();
    const app = await service.issueSession(USER_ID);
    const appSid = jwt.decode(app.refreshToken).sid;
    const widget = await service.issueWidgetSession(USER_ID, appSid);

    expect(jwt.decode(widget.refreshToken).sid).not.toBe(appSid);
    await service.rotate(widget.refreshToken);
    await expect(service.rotate(app.refreshToken)).resolves.toHaveProperty('refreshToken');
  });

  it('위젯 세션을 다시 발급하면 같은 앱 세션의 이전 위젯 세션은 폐기된다', async () => {
    const { service, jwt } = setup();
    const appSid = jwt.decode((await service.issueSession(USER_ID)).refreshToken).sid;
    const oldWidget = await service.issueWidgetSession(USER_ID, appSid);
    await service.issueWidgetSession(USER_ID, appSid);

    await expectUnauthorized(service.rotate(oldWidget.refreshToken));
  });

  it('앱 세션을 폐기(로그아웃)하면 그 세션의 위젯 세션도 함께 폐기된다', async () => {
    const { service, jwt } = setup();
    const appSid = jwt.decode((await service.issueSession(USER_ID)).refreshToken).sid;
    const widget = await service.issueWidgetSession(USER_ID, appSid);

    await service.revokeFamily(appSid);
    await expectUnauthorized(service.rotate(widget.refreshToken));
  });
});

describe('TokenService 정리', () => {
  it('만료된 토큰 행만 삭제한다', async () => {
    const { service, rows } = setup();
    await service.issueSession(USER_ID);
    rows[0].expiresAt = new Date(NOW - 1000);
    await service.issueSession(USER_ID);

    expect(await service.deleteExpired()).toBe(1);
    expect(rows).toHaveLength(1);
  });
});
