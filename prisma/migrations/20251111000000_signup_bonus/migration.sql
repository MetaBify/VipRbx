ALTER TABLE "User"
ADD COLUMN "signupBonusAwarded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" SET "signupBonusAwarded" = true;
