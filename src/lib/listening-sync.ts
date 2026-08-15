import {
  ListeningTimeRange,
  type Prisma,
  SyncStatus,
} from "@prisma/client";

import { db } from "@/lib/db";
import { refreshComparisonsForUser } from "@/lib/comparisons";
import { ACTIVE_SYNC_TIMEOUT_MS } from "@/lib/listening-sync-policy";
import {
  BEHAVIORAL_SPOTIFY_SCOPES,
  getSpotifyAccessToken,
  hasSpotifyScopes,
  SpotifyReauthorizationError,
} from "@/lib/spotify";
import {
  SpotifyApiClient,
  type SpotifyArtist,
  type SpotifySavedTrack,
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
  const activeSync = await db.listeningSync.findFirst({
    where: {
      userId,
      status: SyncStatus.PROCESSING,
      startedAt: { gte: new Date(Date.now() - ACTIVE_SYNC_TIMEOUT_MS) },
    },
    select: { id: true },
  });

  if (activeSync) {
    return { syncId: activeSync.id, skipped: true };
  }

  const sync = await db.listeningSync.create({
    data: { userId, status: SyncStatus.PROCESSING },
  });

  try {
    if (!(await hasSpotifyScopes(userId, BEHAVIORAL_SPOTIFY_SCOPES))) {
      throw new SpotifyReauthorizationError();
    }

    const accessToken = await getSpotifyAccessToken(userId);
    const spotify = new SpotifyApiClient(accessToken);
    const latestPlay = await db.recentPlay.findFirst({
      where: { userId },
      orderBy: { playedAt: "desc" },
      select: { playedAt: true },
    });
    const [ranges, recentResponse, savedTracks] = await Promise.all([
      Promise.all(spotifyTimeRanges.map(async (timeRange) => {
        const [artists, tracks] = await Promise.all([
          spotify.getTopArtists(timeRange),
          spotify.getTopTracks(timeRange),
        ]);

        return { timeRange, artists, tracks } satisfies ListeningRangeData;
      })),
      spotify.getRecentlyPlayed(latestPlay?.playedAt.getTime()),
      getAllSavedTracks(spotify),
    ]);
    const allTracks = new Map(
      [
        ...ranges.flatMap(({ tracks }) => tracks),
        ...recentResponse.items.map(({ track }) => track),
        ...savedTracks.map(({ track }) => track),
      ].map((track) => [track.id, track]),
    );

    await db.$transaction(async (transaction) => {
      for (const artist of new Map(
        ranges.flatMap(({ artists }) => artists.map((artist) => [artist.id, artist])),
      ).values()) {
        await upsertArtist(transaction, artist);
      }
      await createTracksInBulk(transaction, [...allTracks.values()]);
      for (const track of new Map(
        ranges.flatMap(({ tracks }) => tracks.map((track) => [track.id, track])),
      ).values()) {
        await upsertTrack(transaction, track);
      }
      for (const range of ranges) {
        await persistRange(transaction, sync.id, userId, range);
      }

      await transaction.recentPlay.createMany({
        data: recentResponse.items.map(({ track, played_at, context }) => ({
          userId,
          trackId: track.id,
          playedAt: new Date(played_at),
          contextUri: context?.uri ?? null,
        })),
        skipDuplicates: true,
      });
      await transaction.savedTrack.deleteMany({ where: { userId } });
      await transaction.savedTrack.createMany({
        data: savedTracks.map(({ track, added_at }) => ({
          userId,
          trackId: track.id,
          addedAt: new Date(added_at),
        })),
      });

      await transaction.listeningSync.update({
        where: { id: sync.id },
        data: { status: SyncStatus.COMPLETED, completedAt: new Date() },
      });
    }, { timeout: 60_000 });
    await refreshComparisonsForUser(userId);

    return {
      syncId: sync.id,
      ranges: ranges.length,
      recentPlays: recentResponse.items.length,
      savedTracks: savedTracks.length,
    };
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

async function getAllSavedTracks(spotify: SpotifyApiClient) {
  const savedTracks: SpotifySavedTrack[] = [];
  let offset = 0;

  for (let pageNumber = 0; pageNumber < 200; pageNumber += 1) {
    const page = await spotify.getSavedTracksPage(offset);
    savedTracks.push(...page.items);
    if (!page.next) break;
    offset += page.items.length;
  }

  return savedTracks;
}

async function createTracksInBulk(
  transaction: Prisma.TransactionClient,
  tracks: SpotifyTrack[],
) {
  const artists = new Map(
    tracks.flatMap((track) =>
      track.artists.map((artist) => [artist.id, artist] as const),
    ),
  );
  const trackArtists = tracks.flatMap((track) =>
    track.artists.map((artist, position) => ({
      trackId: track.id,
      artistId: artist.id,
      position,
    })),
  );

  for (const chunk of chunks([...artists.values()], 500)) {
    await transaction.spotifyArtist.createMany({
      data: chunk.map((artist) => ({
        id: artist.id,
        name: artist.name,
        uri: artist.uri,
        imageUrl: null,
        genres: [],
      })),
      skipDuplicates: true,
    });
  }
  for (const chunk of chunks(tracks, 500)) {
    await transaction.spotifyTrack.createMany({
      data: chunk.map((track) => ({
        id: track.id,
        name: track.name,
        uri: track.uri,
        albumName: track.album.name,
        albumImageUrl: track.album.images[0]?.url ?? null,
        durationMs: track.duration_ms,
        explicit: track.explicit,
      })),
      skipDuplicates: true,
    });
  }
  for (const chunk of chunks(trackArtists, 500)) {
    await transaction.trackArtist.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function persistRange(
  transaction: Prisma.TransactionClient,
  syncId: string,
  userId: string,
  range: ListeningRangeData,
) {
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

async function upsertTrack(
  transaction: Prisma.TransactionClient,
  track: SpotifyTrack,
) {
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
