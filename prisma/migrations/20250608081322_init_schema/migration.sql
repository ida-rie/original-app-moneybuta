-- CreateTable
CREATE TABLE "BasicAmount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "basicAmount" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasicAmount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmountHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "basicAmountId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmountHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaseQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestHistory" (
    "id" TEXT NOT NULL,
    "baseQuestId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reward" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BasicAmount" ADD CONSTRAINT "BasicAmount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasicAmount" ADD CONSTRAINT "BasicAmount_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmountHistory" ADD CONSTRAINT "AmountHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmountHistory" ADD CONSTRAINT "AmountHistory_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmountHistory" ADD CONSTRAINT "AmountHistory_basicAmountId_fkey" FOREIGN KEY ("basicAmountId") REFERENCES "BasicAmount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseQuest" ADD CONSTRAINT "BaseQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseQuest" ADD CONSTRAINT "BaseQuest_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestHistory" ADD CONSTRAINT "QuestHistory_baseQuestId_fkey" FOREIGN KEY ("baseQuestId") REFERENCES "BaseQuest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestHistory" ADD CONSTRAINT "QuestHistory_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestHistory" ADD CONSTRAINT "QuestHistory_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestHistory" ADD CONSTRAINT "QuestHistory_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
