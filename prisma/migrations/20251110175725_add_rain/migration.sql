-- CreateTable
CREATE TABLE "RainEvent" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "durationMinutes" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "RainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RainClaim" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "rainId" TEXT NOT NULL,

    CONSTRAINT "RainClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RainClaim_rainId_userId_key" ON "RainClaim"("rainId", "userId");

-- AddForeignKey
ALTER TABLE "RainEvent" ADD CONSTRAINT "RainEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RainClaim" ADD CONSTRAINT "RainClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RainClaim" ADD CONSTRAINT "RainClaim_rainId_fkey" FOREIGN KEY ("rainId") REFERENCES "RainEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
