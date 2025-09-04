-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT,
ALTER COLUMN "provider" DROP NOT NULL,
ALTER COLUMN "providerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
