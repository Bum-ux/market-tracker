CREATE TYPE "VideoState" AS ENUM ('VIDEO', 'UPCOMING', 'LIVE', 'ENDED', 'UNAVAILABLE');

CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'youtube',
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "watchUrl" TEXT NOT NULL,
    "embedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER,
    "state" "VideoState" NOT NULL DEFAULT 'VIDEO',
    "scheduledStartAt" TIMESTAMP(3),
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Video_externalId_key" ON "Video"("externalId");
CREATE INDEX "Video_state_publishedAt_idx" ON "Video"("state", "publishedAt");
CREATE INDEX "Video_channelId_idx" ON "Video"("channelId");
