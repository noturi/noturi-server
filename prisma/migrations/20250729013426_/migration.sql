/*
  Warnings:

  - You are about to alter the column `rating` on the `memos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(2,1)`.

*/
-- DropForeignKey
ALTER TABLE "memos" DROP CONSTRAINT "memos_categoryId_fkey";

-- AlterTable
ALTER TABLE "memos" ALTER COLUMN "rating" SET DATA TYPE DECIMAL(2,1);

-- CreateTable
CREATE TABLE "category_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "category_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_custom_fields" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "categoryFieldId" TEXT NOT NULL,

    CONSTRAINT "memo_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_fields_categoryId_idx" ON "category_fields"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "category_fields_categoryId_name_key" ON "category_fields"("categoryId", "name");

-- CreateIndex
CREATE INDEX "memo_custom_fields_memoId_idx" ON "memo_custom_fields"("memoId");

-- CreateIndex
CREATE UNIQUE INDEX "memo_custom_fields_memoId_categoryFieldId_key" ON "memo_custom_fields"("memoId", "categoryFieldId");

-- AddForeignKey
ALTER TABLE "category_fields" ADD CONSTRAINT "category_fields_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memos" ADD CONSTRAINT "memos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_custom_fields" ADD CONSTRAINT "memo_custom_fields_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "memos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memo_custom_fields" ADD CONSTRAINT "memo_custom_fields_categoryFieldId_fkey" FOREIGN KEY ("categoryFieldId") REFERENCES "category_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
