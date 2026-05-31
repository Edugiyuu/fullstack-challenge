-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('BETTING', 'RUNNING', 'CRASHED', 'SETTLED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PLACED', 'CASHED_OUT', 'LOST', 'REFUNDED');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'BETTING',
    "crashPointCents" INTEGER NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "serverSeed" TEXT,
    "clientSeed" TEXT,
    "nonce" INTEGER NOT NULL,
    "bettingEndsAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "crashedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PLACED',
    "cashoutMultiplier" INTEGER,
    "payoutCents" BIGINT,
    "walletOperationId" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashedOutAt" TIMESTAMP(3),

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Round_status_idx" ON "Round"("status");

-- CreateIndex
CREATE INDEX "Round_createdAt_idx" ON "Round"("createdAt");

-- CreateIndex
CREATE INDEX "Bet_playerId_idx" ON "Bet"("playerId");

-- CreateIndex
CREATE INDEX "Bet_status_idx" ON "Bet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_roundId_playerId_key" ON "Bet"("roundId", "playerId");

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
