import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDefaultCategories() {
  // 기존 기본 카테고리 삭제
  await prisma.defaultCategory.deleteMany();

  // 기본 카테고리 데이터
  const defaultCategories = [
    { name: '영화', color: '#FF6B6B', description: '영화 관련 메모', sortOrder: 1 },
    { name: '독서', color: '#4ECDC4', description: '책과 독서 관련 메모', sortOrder: 2 },
    { name: '음악', color: '#45B7D1', description: '음악 관련 메모', sortOrder: 3 },
    { name: '일상', color: '#78909C', description: '일상 생활 메모', sortOrder: 4 },
  ];

  // 기본 카테고리 생성
  for (const category of defaultCategories) {
    await prisma.defaultCategory.create({
      data: category,
    });
  }

  console.log('✅ 기본 카테고리 시드 데이터가 생성되었습니다.');
}

// 직접 실행시에만 작동
if (require.main === module) {
  seedDefaultCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}


