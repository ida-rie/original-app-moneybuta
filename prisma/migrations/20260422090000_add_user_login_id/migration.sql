ALTER TABLE "User"
ADD COLUMN "loginId" TEXT;

UPDATE "User"
SET "loginId" = split_part(email, '@', 1)
WHERE role = 'child'
  AND "loginId" IS NULL;

CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");
