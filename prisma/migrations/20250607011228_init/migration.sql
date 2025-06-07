/*
  Warnings:

  - You are about to drop the column `authUserId` on the `Users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Users_authUserId_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "authUserId";
