import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

const req = (headers: Record<string, string> = {}) => ({ headers }) as any;

function setup(user: unknown = { id: 'user-1', lastActiveAt: new Date(), timezone: 'Asia/Seoul' }) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(undefined),
    },
  };
  const configService = { get: jest.fn().mockReturnValue('test-secret') };
  const strategy = new JwtStrategy(prisma as any, configService as any);
  return { strategy, prisma };
}

describe('JwtStrategy.validate', () => {
  it('access 토큰의 사용자를 반환한다', async () => {
    const { strategy } = setup();

    await expect(strategy.validate(req(),{ sub: 'user-1', email: 'a@a.com', type: 'access' } as any)).resolves.toEqual(
      expect.objectContaining({ id: 'user-1' }),
    );
  });

  it('type이 없는 토큰(어드민 로그인)도 허용한다', async () => {
    const { strategy } = setup();

    await expect(strategy.validate(req(),{ sub: 'user-1', email: 'a@a.com', role: 'ADMIN' })).resolves.toBeDefined();
  });

  it('사용자가 없으면 401을 던진다', async () => {
    const { strategy } = setup(null);

    await expect(strategy.validate(req(),{ sub: 'deleted', email: 'a@a.com' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('오늘 활동 기록이 없으면 lastActiveAt을 갱신한다', async () => {
    const { strategy, prisma } = setup({ id: 'user-1', lastActiveAt: null });

    await strategy.validate(req(),{ sub: 'user-1', email: 'a@a.com' });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
  });

  it('앱이 보낸 시간대가 다르면 저장한다', async () => {
    const { strategy, prisma } = setup();

    const user = await strategy.validate(req({ 'x-timezone': 'America/New_York' }), { sub: 'user-1', email: 'a@a.com' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { timezone: 'America/New_York' },
    });
    expect(user.timezone).toBe('America/New_York');
  });

  it('시간대가 같거나 잘못된 값이면 저장하지 않는다', async () => {
    const { strategy, prisma } = setup();

    await strategy.validate(req({ 'x-timezone': 'Asia/Seoul' }), { sub: 'user-1', email: 'a@a.com' });
    await strategy.validate(req({ 'x-timezone': 'Not/AZone' }), { sub: 'user-1', email: 'a@a.com' });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────
  // access/refresh가 같은 secret으로 서명되므로 type 검사가 없으면 30일짜리 refresh 토큰이 Bearer로 통과한다.

  it('[회귀] refresh 토큰은 API 인증에 쓸 수 없어야 한다', async () => {
    const { strategy } = setup();

    await expect(
      strategy.validate(req(),{ sub: 'user-1', email: 'a@a.com', type: 'refresh' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
