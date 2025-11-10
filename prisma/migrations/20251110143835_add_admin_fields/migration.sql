-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatMutedUntil" TIMESTAMP(3),
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
