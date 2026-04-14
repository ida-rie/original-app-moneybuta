/*
  Warnings:

  - A unique constraint covering the columns `[childUserId,date]` on the table `AmountHistory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[childUserId,month]` on the table `BasicAmount` will be added. If there are existing duplicate values, this will fail.
  - Made the column `questDate` on table `QuestHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "AmountHistory_userId_date_key";

-- AlterTable
ALTER TABLE "QuestHistory" ALTER COLUMN "questDate" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AmountHistory_childUserId_date_key" ON "AmountHistory"("childUserId", "date");

-- CreateIndex
CREATE INDEX "BaseQuest_childUserId_idx" ON "BaseQuest"("childUserId");

-- CreateIndex
CREATE INDEX "BasicAmount_childUserId_idx" ON "BasicAmount"("childUserId");

-- CreateIndex
CREATE INDEX "BasicAmount_childUserId_month_idx" ON "BasicAmount"("childUserId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "BasicAmount_childUserId_month_key" ON "BasicAmount"("childUserId", "month");

-- CreateIndex
CREATE INDEX "QuestHistory_childUserId_idx" ON "QuestHistory"("childUserId");

-- CreateIndex
CREATE INDEX "QuestHistory_childUserId_questDate_idx" ON "QuestHistory"("childUserId", "questDate");

-- CreateIndex
CREATE INDEX "QuestHistory_approved_approvedAt_idx" ON "QuestHistory"("approved", "approvedAt");
