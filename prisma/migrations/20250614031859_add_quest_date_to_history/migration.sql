/*
  Warnings:

  - A unique constraint covering the columns `[baseQuestId,questDate]` on the table `QuestHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuestHistory_baseQuestId_questDate_key" ON "QuestHistory"("baseQuestId", "questDate");
