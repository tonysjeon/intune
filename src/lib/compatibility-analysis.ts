import {
  ComparisonStatus,
  ListeningTimeRange,
  type Prisma,
} from "@prisma/client";

import {
  calculateCompatibility,
  COMPATIBILITY_MODEL_VERSION,
  type CompatibilityProfile,
} from "@/lib/compatibility-scoring";
import { db } from "@/lib/db";
import { rankRecommendations } from "@/lib/mutual-recommendations";

export interface SharedArtistResult {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface SharedTrackResult {
  id: string;
  name: string;
  albumName: string;
  albumImageUrl: string | null;
}

export interface CompatibilityResultJson {
  artistByRange: Record<ListeningTimeRange, number>;
  trackByRange: Record<ListeningTimeRange, number>;
  sharedArtists: SharedArtistResult[];
  sharedTracks: SharedTrackResult[];
  recommendations: DirectionalRecommendations[];
  unavailableComponents: ["taste_vector", "discovery"];
}

export interface RecommendationResult extends SharedTrackResult {
  score: number;
  reasons: string[];
}

export interface DirectionalRecommendations {
  fromUserId: string;
  toUserId: string;
  items: RecommendationResult[];
}

export class ComparisonAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonAnalysisError";
  }
}

type SnapshotWithItems = Prisma.ListeningSnapshotGetPayload<{
  include: {
    topArtists: { include: { artist: true } };
    topTracks: {
      include: {
        track: { include: { artists: { include: { artist: true } } } };
      };
    };
  };
}>;

const ranges = [
  ListeningTimeRange.SHORT_TERM,
  ListeningTimeRange.MEDIUM_TERM,
  ListeningTimeRange.LONG_TERM,
] as const;

function latestSnapshots(snapshots: SnapshotWithItems[]) {
  const latest = new Map<string, SnapshotWithItems>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.userId}:${snapshot.timeRange}`;
    if (!latest.has(key)) latest.set(key, snapshot);
  }
  return latest;
}

function buildProfile(
  snapshots: Map<string, SnapshotWithItems>,
  userId: string,
): CompatibilityProfile {
  return Object.fromEntries(
    ranges.map((range) => {
      const snapshot = snapshots.get(`${userId}:${range}`);
      if (!snapshot) {
        throw new ComparisonAnalysisError("Both listeners need a complete listening sync");
      }
      return [
        range,
        {
          artists: snapshot.topArtists.map(({ artist, rank }) => ({
            id: artist.id,
            rank,
            genres: artist.genres,
          })),
          tracks: snapshot.topTracks.map(({ track, rank }) => ({
            id: track.id,
            rank,
          })),
        },
      ];
    }),
  ) as unknown as CompatibilityProfile;
}

function sharedItems(
  snapshots: Map<string, SnapshotWithItems>,
  firstUserId: string,
  secondUserId: string,
) {
  const first = snapshots.get(`${firstUserId}:${ListeningTimeRange.MEDIUM_TERM}`)!;
  const second = snapshots.get(`${secondUserId}:${ListeningTimeRange.MEDIUM_TERM}`)!;
  const secondArtistRanks = new Map(
    second.topArtists.map(({ artistId, rank }) => [artistId, rank]),
  );
  const secondTrackRanks = new Map(
    second.topTracks.map(({ trackId, rank }) => [trackId, rank]),
  );

  const sharedArtists = first.topArtists
    .filter(({ artistId }) => secondArtistRanks.has(artistId))
    .sort((a, b) =>
      a.rank + secondArtistRanks.get(a.artistId)! -
      (b.rank + secondArtistRanks.get(b.artistId)!),
    )
    .slice(0, 8)
    .map(({ artist }) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.imageUrl,
    }));
  const sharedTracks = first.topTracks
    .filter(({ trackId }) => secondTrackRanks.has(trackId))
    .sort((a, b) =>
      a.rank + secondTrackRanks.get(a.trackId)! -
      (b.rank + secondTrackRanks.get(b.trackId)!),
    )
    .slice(0, 8)
    .map(({ track }) => ({
      id: track.id,
      name: track.name,
      albumName: track.albumName,
      albumImageUrl: track.albumImageUrl,
    }));

  return { sharedArtists, sharedTracks };
}

function directionalRecommendations(
  snapshots: Map<string, SnapshotWithItems>,
  fromUserId: string,
  toUserId: string,
): DirectionalRecommendations {
  const sender = snapshots.get(`${fromUserId}:${ListeningTimeRange.MEDIUM_TERM}`)!;
  const recipient = snapshots.get(`${toUserId}:${ListeningTimeRange.MEDIUM_TERM}`)!;
  const tracksById = new Map(sender.topTracks.map(({ track }) => [track.id, track]));
  const ranked = rankRecommendations(
    sender.topTracks.map(({ track, rank }) => ({
      id: track.id,
      rank,
      artists: track.artists.map(({ artist }) => ({
        id: artist.id,
        genres: artist.genres,
      })),
    })),
    new Set(recipient.topTracks.map(({ trackId }) => trackId)),
    recipient.topArtists.map(({ artist, rank }) => ({
      id: artist.id,
      rank,
      genres: artist.genres,
    })),
  );

  return {
    fromUserId,
    toUserId,
    items: ranked.map(({ trackId, score, reasons }) => {
      const track = tracksById.get(trackId)!;
      return {
        id: track.id,
        name: track.name,
        albumName: track.albumName,
        albumImageUrl: track.albumImageUrl,
        score,
        reasons,
      };
    }),
  };
}

export async function analyzeComparison(comparisonId: string, userId: string) {
  const comparison = await db.comparison.findFirst({
    where: { id: comparisonId, members: { some: { userId } } },
    select: { status: true, members: { select: { userId: true } } },
  });

  if (!comparison) throw new ComparisonAnalysisError("Comparison not found");
  if (comparison.members.length !== 2) {
    throw new ComparisonAnalysisError("Two listeners are required for analysis");
  }
  if (comparison.status === ComparisonStatus.PENDING) {
    throw new ComparisonAnalysisError("Both listeners must sync before analysis");
  }
  if (comparison.status === ComparisonStatus.PROCESSING) {
    throw new ComparisonAnalysisError("This comparison is already being analyzed");
  }

  await db.comparison.update({
    where: { id: comparisonId },
    data: { status: ComparisonStatus.PROCESSING },
  });

  try {
    const userIds = comparison.members.map(({ userId: memberId }) => memberId);
    const snapshots = await db.listeningSnapshot.findMany({
      where: { userId: { in: userIds } },
      orderBy: { capturedAt: "desc" },
      include: {
        topArtists: { include: { artist: true }, orderBy: { rank: "asc" } },
        topTracks: {
          include: {
            track: {
              include: {
                artists: { include: { artist: true }, orderBy: { position: "asc" } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });
    const latest = latestSnapshots(snapshots);
    const scores = calculateCompatibility(
      buildProfile(latest, userIds[0]),
      buildProfile(latest, userIds[1]),
    );
    const shared = sharedItems(latest, userIds[0], userIds[1]);
    const resultJson: CompatibilityResultJson = {
      artistByRange: scores.artistByRange,
      trackByRange: scores.trackByRange,
      ...shared,
      recommendations: [
        directionalRecommendations(latest, userIds[0], userIds[1]),
        directionalRecommendations(latest, userIds[1], userIds[0]),
      ],
      unavailableComponents: ["taste_vector", "discovery"],
    };

    const result = await db.$transaction(async (transaction) => {
      const saved = await transaction.comparisonResult.upsert({
        where: {
          comparisonId_modelVersion: {
            comparisonId,
            modelVersion: COMPATIBILITY_MODEL_VERSION,
          },
        },
        create: {
          comparisonId,
          modelVersion: COMPATIBILITY_MODEL_VERSION,
          overallScore: scores.overall,
          artistScore: scores.artist,
          trackScore: scores.track,
          genreScore: scores.genre,
          embeddingScore: 0,
          resultJson: resultJson as unknown as Prisma.InputJsonValue,
        },
        update: {
          overallScore: scores.overall,
          artistScore: scores.artist,
          trackScore: scores.track,
          genreScore: scores.genre,
          embeddingScore: 0,
          resultJson: resultJson as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
        },
      });
      await transaction.comparison.update({
        where: { id: comparisonId },
        data: { status: ComparisonStatus.COMPLETED, completedAt: new Date() },
      });
      return saved;
    });

    return result;
  } catch (error) {
    await db.comparison.update({
      where: { id: comparisonId },
      data: { status: ComparisonStatus.FAILED },
    });
    throw error;
  }
}
