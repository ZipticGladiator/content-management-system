-- AlterTable
ALTER TABLE "TiktokClip" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TiktokClip_deletedAt_idx" ON "TiktokClip"("deletedAt");

-- CreateIndex
CREATE INDEX "YoutubeVideo_deletedAt_idx" ON "YoutubeVideo"("deletedAt");
