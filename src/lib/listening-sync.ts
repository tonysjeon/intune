import {
  ListeningTimeRange,
  type Prisma,
  SyncStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { getSpotifyAccessToken } from "@/lib/spotify";
import {
  SpotifyApiClient,
  type SpotifyArtist,
  type SpotifyTimeRange,
  type SpotifyTrack,
  spotifyTimeRanges,
} from "@/lib/spotify-api";

const prismaTimeRanges: Record<SpotifyTimeRange, ListeningTimeRange> = {
  short_term: ListeningTimeRange.SHORT_TERM,
  medium_term: ListeningTimeRange.MEDIUM_TERM,
  long_term: ListeningTimeRange.LONG_TERM,
};

interface ListeningRangeData {
  timeRange: SpotifyTimeRange;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
}

export async function syncSpotifyListeningData(userId: string) {
  const sync = await db.listeningSync.create({
    data: { userId, status: SyncStatus.PROCESSING },
  });

  try {
    const accessToken = await getSpotifyAccessToken(userId);
    const spotify = new SpotifyApiClient(accessToken);
    const ranges = await Promise.all(
      spotifyTimeRanges.map(async (timeRange) => {
        const [artists, tracks] = await Promise.all([
          spotify.getTopArtists(timeRange),
          spotify.getTopTracks(timeRange),
        ]);

        return { timeRange, artists, tracks } satisfies ListeningRangeData;
      }),
    );

    await db.$transaction(async (transaction) => {
      for (const range of ranges) {
        await persistRange(transaction, sync.id, userId, range);
      }

      await transaction.listeningSync.update({
        where: { id: sync.id },
        data: { status: SyncStatus.COMPLETED, completedAt: new Date() },
      });
    });

    return { syncId: sync.id, ranges: ranges.length };
  } catch (error) {
    await db.listeningSync.update({
      where: { id: sync.id },
      data: {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        error: getSafeSyncError(error),
      },
    });
    throw error;
  }
}

async function persistRange(
  transaction: Prisma.TransactionClient,
  syncId: string,
  userId: string,
  range: ListeningRangeData,
) {
  for (const artist of range.artists) {
    await upsertArtist(transaction, artist);
  }

  for (const track of range.tracks) {
    for (const artist of track.artists) {
      await transaction.spotifyArtist.upsert({
        where: { id: artist.id },
        create: { ...artist, genres: [], imageUrl: null },
        update: { name: artist.name, uri: artist.uri },
      });
    }

    await transaction.spotifyTrack.upsert({
      where: { id: track.id },
      create: {
        id: track.id,
        name: track.name,
        uri: track.uri,
        albumName: track.album.name,
        albumImageUrl: track.album.images[0]?.url ?? null,
        durationMs: track.duration_ms,
        explicit: track.explicit,
      },
      update: {
        name: track.name,
        uri: track.uri,
        albumName: track.album.name,
        albumImageUrl: track.album.images[0]?.url ?? null,
        durationMs: track.duration_ms,
        explicit: track.explicit,
      },
    });

    await transaction.trackArtist.deleteMany({ where: { trackId: track.id } });
    await transaction.trackArtist.createMany({
      data: track.artists.map((artist, position) => ({
        trackId: track.id,
        artistId: artist.id,
        position,
      })),
    });
  }

  const snapshot = await transaction.listeningSnapshot.create({
    data: {
      syncId,
      userId,
      timeRange: prismaTimeRanges[range.timeRange],
    },
  });

  await transaction.topArtist.createMany({
    data: range.artists.map((artist, index) => ({
      snapshotId: snapshot.id,
      artistId: artist.id,
      rank: index + 1,
    })),
  });
  await transaction.topTrack.createMany({
    data: range.tracks.map((track, index) => ({
      snapshotId: snapshot.id,
      trackId: track.id,
      rank: index + 1,
    })),
  });
}

function upsertArtist(
  transaction: Prisma.TransactionClient,
  artist: SpotifyArtist,
) {
  return transaction.spotifyArtist.upsert({
    where: { id: artist.id },
    create: {
      id: artist.id,
      name: artist.name,
      uri: artist.uri,
      imageUrl: artist.images[0]?.url ?? null,
      genres: artist.genres,
    },
    update: {
      name: artist.name,
      uri: artist.uri,
      imageUrl: artist.images[0]?.url ?? null,
      genres: artist.genres,
    },
  });
}

function getSafeSyncError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unknown Spotify sync error";
}
