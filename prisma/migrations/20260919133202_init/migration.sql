-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SEQUELS', 'DEVSECOPS_CLOUD', 'HANDS_ON', 'COMMUNITY', 'SA_INDUSTRY');

-- CreateEnum
CREATE TYPE "YoutubeStatus" AS ENUM ('IDEA', 'SCRIPT', 'FILM', 'EDIT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TiktokStatus" AS ENUM ('IDEA', 'SCRIPT', 'FILM', 'EDIT', 'POSTED');

-- CreateEnum
CREATE TYPE "ScriptStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pitch" TEXT NOT NULL DEFAULT '',
    "category" "Category" NOT NULL DEFAULT 'SEQUELS',
    "status" "YoutubeStatus" NOT NULL DEFAULT 'IDEA',
    "dueDate" TIMESTAMP(3),
    "cost" INTEGER NOT NULL DEFAULT 0,
    "editor" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "topPick" BOOLEAN NOT NULL DEFAULT false,
    "stepScript" BOOLEAN NOT NULL DEFAULT false,
    "stepFilm" BOOLEAN NOT NULL DEFAULT false,
    "stepEdit" BOOLEAN NOT NULL DEFAULT false,
    "stepThumbnail" BOOLEAN NOT NULL DEFAULT false,
    "stepUpload" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokClip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pitch" TEXT NOT NULL DEFAULT '',
    "category" "Category" NOT NULL DEFAULT 'SEQUELS',
    "status" "TiktokStatus" NOT NULL DEFAULT 'IDEA',
    "dueDate" TIMESTAMP(3),
    "url" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "status" "ScriptStatus" NOT NULL DEFAULT 'DRAFT',
    "youtubeVideoId" TEXT,
    "tiktokClipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Script_youtubeVideoId_key" ON "Script"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "Script_tiktokClipId_key" ON "Script"("tiktokClipId");

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_tiktokClipId_fkey" FOREIGN KEY ("tiktokClipId") REFERENCES "TiktokClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
