-- CreateEnum
CREATE TYPE "ListeningTimeRange" AS ENUM ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ListeningSync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ListeningSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningSnapshot" (
    "id" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timeRange" "ListeningTimeRange" NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListeningSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyArtist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "imageUrl" TEXT,
    "genres" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyTrack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "albumImageUrl" TEXT,
    "durationMs" INTEGER NOT NULL,
    "explicit" BOOLEAN NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackArtist" (
    "trackId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "TrackArtist_pkey" PRIMARY KEY ("trackId","artistId")
);

-- CreateTable
CREATE TABLE "TopArtist" (
    "snapshotId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "TopArtist_pkey" PRIMARY KEY ("snapshotId","artistId")
);

-- CreateTable
CREATE TABLE "TopTrack" (
    "snapshotId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "TopTrack_pkey" PRIMARY KEY ("snapshotId","trackId")
);

-- CreateIndex
CREATE INDEX "ListeningSync_userId_startedAt_idx" ON "ListeningSync"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ListeningSync_status_idx" ON "ListeningSync"("status");

-- CreateIndex
CREATE INDEX "ListeningSnapshot_userId_timeRange_capturedAt_idx" ON "ListeningSnapshot"("userId", "timeRange", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListeningSnapshot_syncId_timeRange_key" ON "ListeningSnapshot"("syncId", "timeRange");

-- CreateIndex
CREATE INDEX "TrackArtist_artistId_idx" ON "TrackArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackArtist_trackId_position_key" ON "TrackArtist"("trackId", "position");

-- CreateIndex
CREATE INDEX "TopArtist_artistId_idx" ON "TopArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "TopArtist_snapshotId_rank_key" ON "TopArtist"("snapshotId", "rank");

-- CreateIndex
CREATE INDEX "TopTrack_trackId_idx" ON "TopTrack"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "TopTrack_snapshotId_rank_key" ON "TopTrack"("snapshotId", "rank");

-- AddForeignKey
ALTER TABLE "ListeningSync" ADD CONSTRAINT "ListeningSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeningSnapshot" ADD CONSTRAINT "ListeningSnapshot_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "ListeningSync"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeningSnapshot" ADD CONSTRAINT "ListeningSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackArtist" ADD CONSTRAINT "TrackArtist_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackArtist" ADD CONSTRAINT "TrackArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "SpotifyArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopArtist" ADD CONSTRAINT "TopArtist_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ListeningSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopArtist" ADD CONSTRAINT "TopArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "SpotifyArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopTrack" ADD CONSTRAINT "TopTrack_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ListeningSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopTrack" ADD CONSTRAINT "TopTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
