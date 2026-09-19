-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "youtube_video_id" TEXT,
    "tiktok_clip_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_youtube_video_id_idx" ON "Comment"("youtube_video_id");

-- CreateIndex
CREATE INDEX "Comment_tiktok_clip_id_idx" ON "Comment"("tiktok_clip_id");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "YoutubeVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_tiktok_clip_id_fkey" FOREIGN KEY ("tiktok_clip_id") REFERENCES "TiktokClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
