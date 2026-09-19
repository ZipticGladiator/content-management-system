-- CreateEnum
CREATE TYPE "InspirationPlatform" AS ENUM ('YOUTUBE', 'TIKTOK', 'OTHER');

-- CreateEnum
CREATE TYPE "InspirationType" AS ENUM ('COMPETITOR', 'INSPIRATION');

-- CreateTable
CREATE TABLE "Inspiration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "InspirationPlatform" NOT NULL DEFAULT 'YOUTUBE',
    "type" "InspirationType" NOT NULL DEFAULT 'INSPIRATION',
    "url" TEXT NOT NULL DEFAULT '',
    "followers" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspiration_pkey" PRIMARY KEY ("id")
);
