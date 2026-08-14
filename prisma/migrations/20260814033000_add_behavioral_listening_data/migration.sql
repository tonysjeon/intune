CREATE TABLE "RecentPlay" (
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "contextUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentPlay_pkey" PRIMARY KEY ("userId", "playedAt")
);

CREATE TABLE "SavedTrack" (
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTrack_pkey" PRIMARY KEY ("userId", "trackId")
);

CREATE INDEX "RecentPlay_userId_playedAt_idx" ON "RecentPlay"("userId", "playedAt");
CREATE INDEX "RecentPlay_trackId_idx" ON "RecentPlay"("trackId");
CREATE INDEX "SavedTrack_userId_addedAt_idx" ON "SavedTrack"("userId", "addedAt");
CREATE INDEX "SavedTrack_trackId_idx" ON "SavedTrack"("trackId");

ALTER TABLE "RecentPlay" ADD CONSTRAINT "RecentPlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecentPlay" ADD CONSTRAINT "RecentPlay_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedTrack" ADD CONSTRAINT "SavedTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedTrack" ADD CONSTRAINT "SavedTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
