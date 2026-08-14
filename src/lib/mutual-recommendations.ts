export interface RecommendationArtist {
  id: string;
  genres: string[];
}

export interface RecommendationTrack {
  id: string;
  rank: number;
  artists: RecommendationArtist[];
}

export interface RecommendationTasteArtist extends RecommendationArtist {
  rank: number;
}

export interface RankedRecommendation {
  trackId: string;
  score: number;
  reasons: string[];
}

function rankWeight(rank: number): number {
  return 1 / Math.log2(rank + 1);
}

function recipientGenreWeights(artists: RecommendationTasteArtist[]) {
  const weights = new Map<string, number>();
  for (const artist of artists) {
    for (const genre of artist.genres) {
      weights.set(genre, (weights.get(genre) ?? 0) + rankWeight(artist.rank));
    }
  }
  const maximum = Math.max(0, ...weights.values());
  if (maximum) {
    for (const [genre, weight] of weights) weights.set(genre, weight / maximum);
  }
  return weights;
}

export function rankRecommendations(
  candidates: RecommendationTrack[],
  knownTrackIds: Set<string>,
  recipientArtists: RecommendationTasteArtist[],
  limit = 5,
): RankedRecommendation[] {
  const recipientArtistRanks = new Map(
    recipientArtists.map(({ id, rank }) => [id, rank]),
  );
  const genreWeights = recipientGenreWeights(recipientArtists);

  return candidates
    .filter((track) => !knownTrackIds.has(track.id))
    .map((track) => {
      const artistAffinity = Math.max(
        0,
        ...track.artists.map((artist) => {
          const rank = recipientArtistRanks.get(artist.id);
          return rank ? rankWeight(rank) : 0;
        }),
      );
      const genres = new Set(track.artists.flatMap((artist) => artist.genres));
      const genreAffinity = genres.size
        ? [...genres].reduce((sum, genre) => sum + (genreWeights.get(genre) ?? 0), 0) /
          genres.size
        : 0;
      const senderAffinity = rankWeight(track.rank);
      const score = 100 * (
        0.55 * genreAffinity +
        0.3 * artistAffinity +
        0.15 * senderAffinity
      );
      const reasons: string[] = [];

      if (artistAffinity > 0) reasons.push("Features an artist already in their rotation");
      if (genreAffinity > 0) reasons.push("Matches genres they listen to most");
      reasons.push("Highly ranked by the sender");

      return { trackId: track.id, score: Math.round(score), reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
