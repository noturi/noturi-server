import { UnauthorizedException } from '@nestjs/common';
import { ClientAuthService } from './auth.client.service';

// 토큰 검증 결과(Apple이 서명한 값) — 신원 판단의 기준이 되어야 하는 값
const TOKEN_SUB = '000111.apple-sub.0001';
const TOKEN_EMAIL = 'attacker@privaterelay.appleid.com';

const existingUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: TOKEN_EMAIL,
  name: '사용자',
  nickname: 'attacker',
  avatarUrl: null,
  providers: ['APPLE'],
  providerId: TOKEN_SUB,
  ...overrides,
});

function setup() {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: { createMany: jest.fn() },
    userSettings: { create: jest.fn(), updateMany: jest.fn() },
    userDevice: { deleteMany: jest.fn(), count: jest.fn() },
    // 트랜잭션 콜백에 같은 mock을 tx로 넘긴다
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) => callback(prisma));
  const tokenService = {
    generateTokens: jest.fn().mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' }),
  };
  const oauthService = {
    verifyAppleToken: jest.fn().mockResolvedValue({ providerId: TOKEN_SUB, email: TOKEN_EMAIL }),
    verifyGoogleToken: jest.fn(),
  };
  const categoriesAdminService = { getActiveDefaultCategories: jest.fn().mockResolvedValue([]) };

  const service = new ClientAuthService(
    prisma as any,
    tokenService as any,
    oauthService as any,
    categoriesAdminService as any,
  );

  return { service, prisma, tokenService, oauthService, categoriesAdminService };
}

describe('ClientAuthService.appleLogin', () => {
  it('신규 사용자는 토큰의 sub/email로 생성하고 기본 카테고리·설정을 만든다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValueOnce(null); // 계정 조회
    prisma.user.findFirst.mockResolvedValueOnce(null); // 닉네임 중복 확인
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve(existingUser({ ...data, id: 'new' })));

    const result = await service.appleLogin({
      idToken: 'id-token',
      user: TOKEN_SUB,
      appleId: TOKEN_SUB,
      email: TOKEN_EMAIL,
      name: '홍길동',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: TOKEN_EMAIL,
        providerId: TOKEN_SUB,
        providers: ['APPLE'],
        name: '홍길동',
      }),
    });
    expect(prisma.category.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.userSettings.create).toHaveBeenCalledTimes(1);
    expect(result.isNewUser).toBe(true);
    expect(result.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('이미 Apple로 가입한 사용자는 갱신 없이 토큰만 발급한다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(existingUser());

    const result = await service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB, appleId: TOKEN_SUB });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result.isNewUser).toBe(false);
    expect(result.user).toEqual({
      id: 'user-1',
      email: TOKEN_EMAIL,
      name: '사용자',
      nickname: 'attacker',
      avatarUrl: '',
    });
  });

  it('같은 이메일의 Google 가입자는 providers에 APPLE을 추가한다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(existingUser({ providers: ['GOOGLE'], providerId: 'google-sub' }));
    prisma.user.update.mockImplementation(({ data }) => Promise.resolve(existingUser(data)));

    await service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB, appleId: TOKEN_SUB });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { providers: ['GOOGLE', 'APPLE'], providerId: TOKEN_SUB },
    });
  });

  it('Apple 토큰 검증이 실패하면 401을 던진다', async () => {
    const { service, oauthService, prisma } = setup();
    oauthService.verifyAppleToken.mockRejectedValue(new UnauthorizedException('Invalid Apple token'));

    await expect(service.appleLogin({ idToken: 'bad', user: TOKEN_SUB })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  // ─── 회귀 방지 (과거 버그) ─────────────────────────────────────────────
  // 요청 바디의 email/user가 검증된 토큰 값보다 우선해서, 남의 이메일로 그 계정 토큰을 받을 수 있다.

  it('[회귀] 바디 email이 토큰 email과 달라도 계정 조회는 토큰 email로 해야 한다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);

    await service
      .appleLogin({ idToken: 'id-token', user: TOKEN_SUB, email: 'victim@gmail.com' })
      .catch(() => undefined);

    const where = prisma.user.findFirst.mock.calls[0][0].where;
    expect(JSON.stringify(where)).not.toContain('victim@gmail.com');
  });

  it('[회귀] 바디 user/appleId가 토큰 sub와 달라도 providerId는 토큰 sub로 저장해야 한다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(existingUser({ providers: ['GOOGLE'] }));
    prisma.user.update.mockImplementation(({ data }) => Promise.resolve(existingUser(data)));

    await service.appleLogin({ idToken: 'id-token', user: 'forged-id', appleId: 'forged-id' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ providerId: TOKEN_SUB }) }),
    );
  });
});

describe('ClientAuthService.logout', () => {
  it('푸시 토큰이 없으면 아무것도 지우지 않는다', async () => {
    const { service, prisma } = setup();

    await expect(service.logout('user-1')).resolves.toEqual({ success: true });
    expect(prisma.userDevice.deleteMany).not.toHaveBeenCalled();
  });

  it('마지막 디바이스를 지우면 알림 설정을 끈다', async () => {
    const { service, prisma } = setup();
    prisma.userDevice.count.mockResolvedValue(0);

    await service.logout('user-1', 'ExponentPushToken[abc]');

    expect(prisma.userDevice.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', expoPushToken: 'ExponentPushToken[abc]' },
    });
    expect(prisma.userSettings.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { notification: false },
    });
  });

  it('남은 디바이스가 있으면 알림 설정을 유지한다', async () => {
    const { service, prisma } = setup();
    prisma.userDevice.count.mockResolvedValue(1);

    await service.logout('user-1', 'ExponentPushToken[abc]');

    expect(prisma.userSettings.updateMany).not.toHaveBeenCalled();
  });
});

describe('ClientAuthService.appleLogin — 토큰에 이메일이 없는 경우', () => {
  it('providerId로만 조회한다 (email: undefined 조건으로 아무 계정이나 매칭되지 않게)', async () => {
    const { service, prisma, oauthService } = setup();
    oauthService.verifyAppleToken.mockResolvedValue({ providerId: TOKEN_SUB, email: undefined });
    prisma.user.findFirst.mockResolvedValue(existingUser());

    await service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB, email: 'victim@gmail.com' });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { OR: [{ providerId: TOKEN_SUB }] } });
  });

  it('기존 계정도 없으면 가입시키지 않고 401을 던진다', async () => {
    const { service, prisma, oauthService } = setup();
    oauthService.verifyAppleToken.mockResolvedValue({ providerId: TOKEN_SUB, email: undefined });
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB, email: 'victim@gmail.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('처리 중 내부 에러 메시지는 응답에 노출하지 않는다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockRejectedValue(new Error('PrismaClientKnownRequestError: secret detail'));

    await expect(service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB })).rejects.toThrow(
      'Apple 로그인에 실패했습니다.',
    );
  });
});

describe('ClientAuthService 가입 트랜잭션', () => {
  it('사용자·기본 카테고리·설정 생성을 하나의 트랜잭션으로 묶는다', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve(existingUser({ ...data, id: 'new' })));

    await service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.category.createMany).toHaveBeenCalledWith({
      data: [
        { name: '영화', color: '#FF6B6B', userId: 'new' },
        { name: '음악', color: '#45B7D1', userId: 'new' },
        { name: '책', color: '#4ECDC4', userId: 'new' },
      ],
    });
  });

  it('어드민이 등록한 기본 카테고리가 있으면 그것을 사용한다', async () => {
    const { service, prisma, categoriesAdminService } = setup();
    categoriesAdminService.getActiveDefaultCategories.mockResolvedValue([{ name: '맛집', color: '#000000' }]);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve(existingUser({ ...data, id: 'new' })));

    await service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB });

    expect(prisma.category.createMany).toHaveBeenCalledWith({
      data: [{ name: '맛집', color: '#000000', userId: 'new' }],
    });
  });

  it('기본 데이터 생성이 실패하면 트랜잭션 에러가 401로 전달된다 (사용자만 남지 않음)', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockRejectedValue(new Error('createMany failed'));

    await expect(service.appleLogin({ idToken: 'id-token', user: TOKEN_SUB })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
