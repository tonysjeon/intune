import { describe, expect, it } from "vitest";

import { rankRecommendations } from "./mutual-recommendations";

const recipientArtists = [
  { id: "favorite", rank: 1, genres: ["indie pop"] },
  { id: "second", rank: 2, genres: ["soul"] },
];

describe("mutual recommendations", () => {
  it("excludes tracks the recipient already knows", () => {
    const results = rankRecommendations(
      [{ id: "known", rank: 1, artists: [{ id: "favorite", genres: ["indie pop"] }] }],
      new Set(["known"]),
      recipientArtists,
    );

    expect(results).toEqual([]);
  });

  it("prioritizes matching artists and genres", () => {
    const results = rankRecommendations(
      [
        { id: "unrelated", rank: 1, artists: [{ id: "other", genres: ["metal"] }] },
        { id: "matched", rank: 2, artists: [{ id: "favorite", genres: ["indie pop"] }] },
      ],
      new Set(),
      recipientArtists,
    );

    expect(results.map(({ trackId }) => trackId)).toEqual(["matched", "unrelated"]);
    expect(results[0].reasons).toContain("Features an artist already in their rotation");
  });
});
