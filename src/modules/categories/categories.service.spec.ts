import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';

const USER_ID = 'user-1';
const CATEGORY_ID = 'cat-1';

function setup(category: object | null) {
  const prisma = {
    category: {
      findFirst: jest.fn().mockResolvedValue(category),
      delete: jest.fn().mockReturnValue({ op: 'deleteCategory' }),
    },
    memo: {
      updateMany: jest.fn().mockReturnValue({ op: 'moveMemos' }),
    },
    $transaction: jest.fn().mockResolvedValue([{ count: 3 }, { id: CATEGORY_ID, name: '영화' }]),
  };
  return { service: new CategoriesService(prisma as any), prisma };
}

describe('CategoriesService.remove', () => {
  it('메모가 있어도 삭제하고, 메모는 카테고리를 비워 남긴다 (기타로 이동)', async () => {
    const { service, prisma } = setup({ id: CATEGORY_ID, userId: USER_ID });

    const result = await service.remove(USER_ID, CATEGORY_ID);

    expect(prisma.memo.updateMany).toHaveBeenCalledWith({
      where: { categoryId: CATEGORY_ID, userId: USER_ID },
      data: { categoryId: null },
    });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: CATEGORY_ID } });
    expect(result).toMatchObject({ id: CATEGORY_ID, movedMemoCount: 3 });
  });

  it('메모 이동과 카테고리 삭제를 하나의 트랜잭션으로, 이동을 먼저 실행한다', async () => {
    const { service, prisma } = setup({ id: CATEGORY_ID, userId: USER_ID });

    await service.remove(USER_ID, CATEGORY_ID);

    expect(prisma.$transaction).toHaveBeenCalledWith([{ op: 'moveMemos' }, { op: 'deleteCategory' }]);
  });

  it('내 카테고리가 아니면 404이고 아무것도 변경하지 않는다', async () => {
    const { service, prisma } = setup(null);

    await expect(service.remove(USER_ID, CATEGORY_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
