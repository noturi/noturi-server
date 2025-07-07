import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.refreshToken.deleteMany();
  await prisma.note.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      nickname: 'alice',
      email: 'alice@example.com',
      provider: 'GOOGLE',
      providerId: 'google-alice-123',
      avatarUrl: 'https://example.com/alice.png',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      nickname: 'bob',
      email: 'bob@example.com',
      provider: 'APPLE',
      providerId: 'apple-bob-456',
      avatarUrl: null,
    },
  });

  // Create categories for user1
  const workCategory = await prisma.category.create({
    data: { name: 'Work', userId: user1.id },
  });
  const personalCategory = await prisma.category.create({
    data: { name: 'Personal', userId: user1.id },
  });

  // Create category for user2
  const ideasCategory = await prisma.category.create({
    data: { name: 'Ideas', userId: user2.id },
  });

  // Create notes
  await prisma.note.createMany({
    data: [
      {
        text: 'Finish project',
        rating: 4,
        userId: user1.id,
        categoryId: workCategory.id,
      },
      {
        text: 'Meeting notes',
        rating: 3,
        userId: user1.id,
        categoryId: workCategory.id,
      },
      {
        text: 'Buy groceries',
        rating: 5,
        userId: user1.id,
        categoryId: personalCategory.id,
      },
      {
        text: 'New app concept',
        rating: 4,
        userId: user2.id,
        categoryId: ideasCategory.id,
      },
    ],
  });

  // Create refresh tokens
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { token: 'refresh-token-1', userId: user1.id, expiresAt },
  });
  await prisma.refreshToken.create({
    data: { token: 'refresh-token-2', userId: user2.id, expiresAt },
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
