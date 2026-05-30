CREATE TABLE "ClaimPlusApplication" (
    "id" TEXT NOT NULL,
    "robloxUsername" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimPlusApplication_pkey" PRIMARY KEY ("id")
);
