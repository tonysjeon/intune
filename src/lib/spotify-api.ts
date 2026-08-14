import { z } from "zod";

export const spotifyTimeRanges = [
  "short_term",
  "medium_term",
  "long_term",
] as const;

export type SpotifyTimeRange = (typeof spotifyTimeRanges)[number];

const imageSchema = z.object({
  url: z.url(),
  height: z.number().int().nullable().optional(),
  width: z.number().int().nullable().optional(),
});

export const spotifyArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
  images: z.array(imageSchema).default([]),
  genres: z.array(z.string()).default([]),
});

const simplifiedArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
});

export const spotifyTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
  duration_ms: z.number().int().nonnegative(),
  explicit: z.boolean(),
  artists: z.array(simplifiedArtistSchema).min(1),
  album: z.object({
    name: z.string(),
    images: z.array(imageSchema).default([]),
  }),
});

const topArtistsResponseSchema = z.object({
  items: z.array(spotifyArtistSchema),
});

const topTracksResponseSchema = z.object({
  items: z.array(spotifyTrackSchema),
});

const recentlyPlayedResponseSchema = z.object({
  items: z.array(z.object({
    track: spotifyTrackSchema,
    played_at: z.iso.datetime(),
    context: z.object({ uri: z.string() }).nullable().optional(),
  })),
  cursors: z.object({ after: z.string().nullable().optional() }).optional(),
});

const savedTracksResponseSchema = z.object({
  items: z.array(z.object({
    added_at: z.iso.datetime(),
    track: spotifyTrackSchema,
  })),
  next: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export type SpotifyArtist = z.infer<typeof spotifyArtistSchema>;
export type SpotifyTrack = z.infer<typeof spotifyTrackSchema>;
export type SpotifyRecentPlay = z.infer<typeof recentlyPlayedResponseSchema>["items"][number];
export type SpotifySavedTrack = z.infer<typeof savedTracksResponseSchema>["items"][number];

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export class SpotifyApiClient {
  constructor(
    private readonly accessToken: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  getTopArtists(timeRange: SpotifyTimeRange): Promise<SpotifyArtist[]> {
    return this.getTopItems("artists", timeRange, topArtistsResponseSchema);
  }

  getTopTracks(timeRange: SpotifyTimeRange): Promise<SpotifyTrack[]> {
    return this.getTopItems("tracks", timeRange, topTracksResponseSchema);
  }

  async getRecentlyPlayed(after?: number) {
    const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
    url.searchParams.set("limit", "50");
    if (after) url.searchParams.set("after", String(after));

    return recentlyPlayedResponseSchema.parse(
      await this.getJson(url, "Spotify recently played request"),
    );
  }

  async getSavedTracksPage(offset = 0) {
    const url = new URL("https://api.spotify.com/v1/me/tracks");
    url.searchParams.set("limit", "50");
    url.searchParams.set("offset", String(offset));

    return savedTracksResponseSchema.parse(
      await this.getJson(url, "Spotify saved tracks request"),
    );
  }

  private async getTopItems<T>(
    type: "artists" | "tracks",
    timeRange: SpotifyTimeRange,
    schema: z.ZodType<{ items: T[] }>,
  ): Promise<T[]> {
    const url = new URL(`https://api.spotify.com/v1/me/top/${type}`);
    url.searchParams.set("time_range", timeRange);
    url.searchParams.set("limit", "50");

    return schema.parse(
      await this.getJson(url, `Spotify top ${type} request`),
    ).items;
  }

  private async getJson(url: URL, requestName: string): Promise<unknown> {
    const response = await this.fetcher(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : null;
      throw new SpotifyApiError(
        `${requestName} failed with status ${response.status}`,
        response.status,
        Number.isFinite(retryAfter) ? retryAfter : null,
      );
    }

    return response.json();
  }
}
