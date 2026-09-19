-- CreateTable
CREATE TABLE "YoutubeAuth" (
    "id" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "accessTokenExp" TIMESTAMP(3),
    "channelId" TEXT,
    "channelTitle" TEXT,
    "connectedEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YoutubeAuth_pkey" PRIMARY KEY ("id")
);
