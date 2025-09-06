import { PrismaClient } from '@prisma/client';
import { seedDefaultCategories } from './default-categories-seed';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.refreshToken.deleteMany();
  await prisma.memo.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 기본 카테고리 시드 데이터 생성
  await seedDefaultCategories();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      nickname: 'alice',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      providers: ['GOOGLE'],
      providerId: 'google-alice-123',
      avatarUrl: 'https://example.com/alice.png',
      isStatsPublic: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      nickname: 'bob',
      email: 'bob@example.com',
      name: 'Bob Smith',
      providers: ['APPLE'],
      providerId: 'apple-bob-456',
      avatarUrl: null,
      isStatsPublic: false,
    },
  });

  // Create default categories for user1 (한국어)
  const categories1 = await Promise.all([
    prisma.category.create({
      data: { name: '일상', userId: user1.id, color: '#3B82F6' },
    }),
    prisma.category.create({
      data: { name: '음식', userId: user1.id, color: '#EF4444' },
    }),
    prisma.category.create({
      data: { name: '공부', userId: user1.id, color: '#10B981' },
    }),
    prisma.category.create({
      data: { name: '여행', userId: user1.id, color: '#F59E0B' },
    }),
    prisma.category.create({
      data: { name: '운동', userId: user1.id, color: '#8B5CF6' },
    }),
  ]);

  // Create categories for user2 (영어)
  const categories2 = await Promise.all([
    prisma.category.create({
      data: { name: 'Work', userId: user2.id, color: '#6B7280' },
    }),
    prisma.category.create({
      data: { name: 'Movies', userId: user2.id, color: '#EC4899' },
    }),
    prisma.category.create({
      data: { name: 'Books', userId: user2.id, color: '#06B6D4' },
    }),
  ]);

  // Create memos for user1 (한국어 샘플)
  await prisma.memo.createMany({
    data: [
      {
        title: '신촌 파스타 맛집',
        content: '친구와 함께 간 이탈리안 레스토랑. 크림파스타가 정말 맛있었다. 다음에 또 가고 싶은 곳.',
        rating: 4.5,
        userId: user1.id,
        categoryId: categories1[1].id, // 음식
      },
      {
        title: '토익 공부',
        content: 'LC 파트 연습했는데 아직 많이 부족하다. 더 열심히 해야겠다.',
        rating: 3.0,
        userId: user1.id,
        categoryId: categories1[2].id, // 공부
      },
      {
        title: '제주도 여행',
        content: '3박 4일 제주도 여행. 날씨도 좋고 맛있는 음식도 많이 먹었다. 특히 흑돼지가 최고였다!',
        rating: 5.0,
        userId: user1.id,
        categoryId: categories1[3].id, // 여행
      },
      {
        title: '헬스장 PT',
        content: '첫 PT 수업을 받았다. 트레이너가 친절하게 잘 가르쳐줬다.',
        rating: 4.0,
        userId: user1.id,
        categoryId: categories1[4].id, // 운동
      },
      {
        title: '오늘의 일기',
        content: '평범한 하루였지만 나름 의미있는 시간들이었다.',
        rating: 3.5,
        userId: user1.id,
        categoryId: categories1[0].id, // 일상
      },
      {
        title: '강남 카페',
        content: '아메리카노는 괜찮았는데 디저트가 너무 달았다.',
        rating: 2.5,
        userId: user1.id,
        categoryId: categories1[1].id, // 음식
      },
    ],
  });

  // Create memos for user2 (영어 샘플)
  await prisma.memo.createMany({
    data: [
      {
        title: 'Project Meeting',
        content: 'Discussed the new feature requirements. Team is aligned on the timeline.',
        rating: 4.0,
        userId: user2.id,
        categoryId: categories2[0].id, // Work
      },
      {
        title: 'Inception',
        content: 'Christopher Nolan masterpiece. Mind-bending plot that requires multiple viewings.',
        rating: 4.5,
        userId: user2.id,
        categoryId: categories2[1].id, // Movies
      },
      {
        title: 'Clean Code',
        content: "Robert Martin's book on writing maintainable code. Very insightful.",
        rating: 5.0,
        userId: user2.id,
        categoryId: categories2[2].id, // Books
      },
      {
        title: 'The Matrix',
        content: 'Classic sci-fi movie. Still holds up after all these years.',
        rating: 4.0,
        userId: user2.id,
        categoryId: categories2[1].id, // Movies
      },
      {
        title: 'Code Review',
        content: 'Reviewed pull requests today. Found several issues that need fixing.',
        rating: 3.0,
        userId: user2.id,
        categoryId: categories2[0].id, // Work
      },
    ],
  });

  // Create refresh tokens
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await Promise.all([
    prisma.refreshToken.create({
      data: {
        token: 'refresh-token-alice-' + Date.now(),
        userId: user1.id,
        expiresAt,
      },
    }),
    prisma.refreshToken.create({
      data: {
        token: 'refresh-token-bob-' + Date.now(),
        userId: user2.id,
        expiresAt,
      },
    }),
  ]);

  console.log('🌱 Seed data created successfully!');
  console.log(`👤 Created ${await prisma.user.count()} users`);
  console.log(`📁 Created ${await prisma.category.count()} categories`);
  console.log(`📝 Created ${await prisma.memo.count()} memos`);
  console.log(`🔑 Created ${await prisma.refreshToken.count()} refresh tokens`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
