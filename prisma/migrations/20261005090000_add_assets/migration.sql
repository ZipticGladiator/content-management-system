-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('THUMBNAIL', 'DOCUMENT', 'VIDEO', 'IMAGE', 'AUDIO', 'OTHER');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT NOT NULL DEFAULT '',
    "youtube_video_id" TEXT,
    "tiktok_clip_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_youtube_video_id_idx" ON "Asset"("youtube_video_id");

-- CreateIndex
CREATE INDEX "Asset_tiktok_clip_id_idx" ON "Asset"("tiktok_clip_id");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tiktok_clip_id_fkey" FOREIGN KEY ("tiktok_clip_id") REFERENCES "TiktokClip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

