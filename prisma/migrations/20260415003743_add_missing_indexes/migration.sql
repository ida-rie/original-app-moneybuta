-- CreateIndex
CREATE INDEX "AmountHistory_childUserId_idx" ON "AmountHistory"("childUserId");

-- CreateIndex
CREATE INDEX "AmountHistory_basicAmountId_idx" ON "AmountHistory"("basicAmountId");

-- CreateIndex
CREATE INDEX "User_parentId_idx" ON "User"("parentId");
