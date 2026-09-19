-- CreateEnum
CREATE TYPE "GoalPlatform" AS ENUM ('YOUTUBE', 'TIKTOK');

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "platform" "GoalPlatform" NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "target" INTEGER NOT NULL,
    "manualCurrent" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);
