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
});
