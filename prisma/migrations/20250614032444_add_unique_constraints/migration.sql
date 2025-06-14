/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `AmountHistory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[baseQuestId,childUserId,questDate]` on the table `QuestHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "QuestHistory_baseQuestId_questDate_key";

-- CreateIndex
CREATE UNIQUE INDEX "AmountHistory_userId_date_key" ON "AmountHistory"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "QuestHistory_baseQuestId_childUserId_questDate_key" ON "QuestHistory"("baseQuestId", "childUserId", "questDate");
