-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "youtube_video_id" TEXT,
    "tiktok_clip_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_youtube_video_id_idx" ON "Attachment"("youtube_video_id");

-- CreateIndex
CREATE INDEX "Attachment_tiktok_clip_id_idx" ON "Attachment"("tiktok_clip_id");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_youtube_video_id_fkey" FOREIGN KEY ("youtube_video_id") REFERENCES "YoutubeVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tiktok_clip_id_fkey" FOREIGN KEY ("tiktok_clip_id") REFERENCES "TiktokClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
