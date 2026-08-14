import { describe, expect, it, vi } from "vitest";

import { SpotifyApiClient } from "./spotify-api";

const artistResponse = {
  items: [
    {
      id: "artist-1",
      name: "Artist One",
      uri: "spotify:artist:artist-1",
      images: [{ url: "https://example.com/artist.jpg" }],
      genres: ["indie soul"],
    },
  ],
};

describe("SpotifyApiClient", () => {
  it("requests fifty top artists for the selected time range", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(artistResponse),
    );
    const client = new SpotifyApiClient("access-token", fetcher);

    const artists = await client.getTopArtists("short_term");

    expect(artists[0]?.name).toBe("Artist One");
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(String(url)).toContain("/v1/me/top/artists");
    expect(String(url)).toContain("time_range=short_term");
    expect(String(url)).toContain("limit=50");
    expect(init?.headers).toEqual({ Authorization: "Bearer access-token" });
  });

  it("surfaces rate-limit information without retrying blindly", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "Retry-After": "8" },
      }),
    );
    const client = new SpotifyApiClient("access-token", fetcher);

    const request = client.getTopTracks("long_term");

    await expect(request).rejects.toMatchObject({
      status: 429,
      retryAfter: 8,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects malformed Spotify responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ items: [{ id: "incomplete" }] }));
    const client = new SpotifyApiClient("access-token", fetcher);

    await expect(client.getTopArtists("medium_term")).rejects.toThrow();
  });

  it("requests fifty recent plays after the stored cursor", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      items: [],
      cursors: { after: "1720000000000" },
    }));
    const client = new SpotifyApiClient("access-token", fetcher);

    await client.getRecentlyPlayed(1710000000000);

    const url = String(fetcher.mock.calls[0]?.[0]);
    expect(url).toContain("recently-played");
    expect(url).toContain("limit=50");
    expect(url).toContain("after=1710000000000");
  });

  it("accepts an empty recent-play response with null cursors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      items: [],
      cursors: null,
    }));
    const client = new SpotifyApiClient("access-token", fetcher);

    await expect(client.getRecentlyPlayed()).resolves.toMatchObject({
      items: [],
      cursors: null,
    });
  });

  it("requests saved tracks in pages of fifty", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
      items: [],
      next: null,
      total: 0,
    }));
    const client = new SpotifyApiClient("access-token", fetcher);

    await client.getSavedTracksPage(50);

    const url = String(fetcher.mock.calls[0]?.[0]);
    expect(url).toContain("/v1/me/tracks");
    expect(url).toContain("limit=50");
    expect(url).toContain("offset=50");
  });
});
