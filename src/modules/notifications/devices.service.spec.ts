import { DevicesService } from './devices.service';
import { DevicePlatform } from './dto';

const DTO = { expoPushToken: 'ExponentPushToken[abc]', deviceName: 'iPhone', platform: DevicePlatform.IOS };

function setup(notification: boolean | null = true) {
  const prisma = {
    userDevice: {
      upsert: jest.fn().mockResolvedValue({ id: 'device-1', ...DTO }),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    userSettings: {
      findUnique: jest.fn().mockResolvedValue(notification === null ? null : { notification }),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return { service: new DevicesService(prisma as any), prisma };
}

describe('DevicesService.registerDevice', () => {
  it('일반 등록(알림 켜기)은 디바이스를 등록하고 알림 설정을 켠다', async () => {
    const { service, prisma } = setup(false);

    await service.registerDevice('user-1', DTO);

    expect(prisma.userDevice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { expoPushToken: DTO.expoPushToken } }),
    );
    expect(prisma.userSettings.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', notification: true },
      update: { notification: true },
    });
  });

  it('refreshOnly + 알림 켜짐: 토큰만 갱신하고 설정은 건드리지 않는다', async () => {
    const { service, prisma } = setup(true);

    const result = await service.registerDevice('user-1', { ...DTO, refreshOnly: true });

    expect(result).toEqual(expect.objectContaining({ id: 'device-1' }));
    expect(prisma.userDevice.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
  });

  // 회귀: 앱에서 알림을 끈 뒤 재실행하면 silent 갱신이 알림을 다시 켜던 문제
  it('[회귀] refreshOnly + 알림 꺼짐: 등록하지 않고 알림을 다시 켜지 않는다', async () => {
    const { service, prisma } = setup(false);

    const result = await service.registerDevice('user-1', { ...DTO, refreshOnly: true });

    expect(result).toBeNull();
    expect(prisma.userDevice.upsert).not.toHaveBeenCalled();
    expect(prisma.userSettings.upsert).not.toHaveBeenCalled();
  });

  it('refreshOnly + 설정 없음: 등록하지 않는다', async () => {
    const { service, prisma } = setup(null);

    expect(await service.registerDevice('user-1', { ...DTO, refreshOnly: true })).toBeNull();
    expect(prisma.userDevice.upsert).not.toHaveBeenCalled();
  });
});

describe('DevicesService.removeDevice', () => {
  it('본인 디바이스만 지우고, 남은 디바이스가 없으면 알림을 끈다', async () => {
    const { service, prisma } = setup();
    prisma.userDevice.count.mockResolvedValue(0);

    await service.removeDevice('user-1', 'device-1');

    expect(prisma.userDevice.deleteMany).toHaveBeenCalledWith({ where: { id: 'device-1', userId: 'user-1' } });
    expect(prisma.userSettings.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { notification: false },
    });
  });
});
