export const COMPATIBILITY_MODEL_VERSION = "core-v1";

export interface RankedItem {
  id: string;
  rank: number;
}

export interface RankedArtist extends RankedItem {
  genres: string[];
}

export interface RangeProfile {
  artists: RankedArtist[];
  tracks: RankedItem[];
}

export interface CompatibilityProfile {
  SHORT_TERM: RangeProfile;
  MEDIUM_TERM: RangeProfile;
  LONG_TERM: RangeProfile;
}

export interface CompatibilityScores {
  overall: number;
  artist: number;
  track: number;
  genre: number;
  artistByRange: Record<keyof CompatibilityProfile, number>;
  trackByRange: Record<keyof CompatibilityProfile, number>;
}

const timeRanges = ["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"] as const;

function rankWeight(rank: number): number {
  return 1 / Math.log2(rank + 1);
}

export function weightedJaccard(a: RankedItem[], b: RankedItem[]): number {
  const aWeights = new Map(a.map((item) => [item.id, rankWeight(item.rank)]));
  const bWeights = new Map(b.map((item) => [item.id, rankWeight(item.rank)]));
  const ids = new Set([...aWeights.keys(), ...bWeights.keys()]);

  if (!ids.size) return 0;

  let intersection = 0;
  let union = 0;
  for (const id of ids) {
    const aWeight = aWeights.get(id) ?? 0;
    const bWeight = bWeights.get(id) ?? 0;
    intersection += Math.min(aWeight, bWeight);
    union += Math.max(aWeight, bWeight);
  }

  return union ? intersection / union : 0;
}

function genreVector(artists: RankedArtist[]): Map<string, number> {
  const vector = new Map<string, number>();
  for (const artist of artists) {
    if (!artist.genres.length) continue;
    const weight = rankWeight(artist.rank) / artist.genres.length;
    for (const genre of artist.genres) {
      vector.set(genre, (vector.get(genre) ?? 0) + weight);
    }
  }
  return vector;
}

export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (const key of keys) {
    const aValue = a.get(key) ?? 0;
    const bValue = b.get(key) ?? 0;
    dot += aValue * bValue;
    aMagnitude += aValue ** 2;
    bMagnitude += bValue ** 2;
  }

  return aMagnitude && bMagnitude
    ? dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude))
    : 0;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentage(value: number): number {
  return Math.round(value * 1000) / 10;
}

export function calculateCompatibility(
  a: CompatibilityProfile,
  b: CompatibilityProfile,
): CompatibilityScores {
  const artistByRange = Object.fromEntries(
    timeRanges.map((range) => [
      range,
      percentage(weightedJaccard(a[range].artists, b[range].artists)),
    ]),
  ) as Record<keyof CompatibilityProfile, number>;
  const trackByRange = Object.fromEntries(
    timeRanges.map((range) => [
      range,
      percentage(weightedJaccard(a[range].tracks, b[range].tracks)),
    ]),
  ) as Record<keyof CompatibilityProfile, number>;

  const artist = average(Object.values(artistByRange));
  const track = average(Object.values(trackByRange));
  const genre = percentage(
    cosineSimilarity(
      genreVector(a.MEDIUM_TERM.artists),
      genreVector(b.MEDIUM_TERM.artists),
    ),
  );

  // Normalize the specified artist, track, and genre weights for the core model.
  const overall = (0.3 * artist + 0.2 * track + 0.25 * genre) / 0.75;

  return {
    overall: Math.round(overall * 10) / 10,
    artist: Math.round(artist * 10) / 10,
    track: Math.round(track * 10) / 10,
    genre,
    artistByRange,
    trackByRange,
  };
}
