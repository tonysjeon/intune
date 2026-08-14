import { describe, expect, it } from "vitest";

import {
  calculateCompatibility,
  cosineSimilarity,
  type CompatibilityProfile,
  weightedJaccard,
} from "./compatibility-scoring";

describe("weighted Jaccard similarity", () => {
  it("returns a perfect match for identical rankings", () => {
    const ranking = [{ id: "one", rank: 1 }, { id: "two", rank: 2 }];
    expect(weightedJaccard(ranking, ranking)).toBe(1);
  });

  it("gives a higher score to a shared top-ranked item", () => {
    const first = [{ id: "shared", rank: 1 }, { id: "other", rank: 2 }];
    const topMatch = [{ id: "shared", rank: 1 }, { id: "new", rank: 2 }];
    const lowerMatch = [{ id: "new", rank: 1 }, { id: "other", rank: 2 }];

    expect(weightedJaccard(first, topMatch)).toBeGreaterThan(
      weightedJaccard(first, lowerMatch),
    );
  });
});

describe("cosine similarity", () => {
  it("recognizes parallel and unrelated genre vectors", () => {
    expect(cosineSimilarity(new Map([["pop", 2]]), new Map([["pop", 4]]))).toBe(1);
    expect(cosineSimilarity(new Map([["pop", 1]]), new Map([["jazz", 1]]))).toBe(0);
  });
});

describe("compatibility scoring", () => {
  it("returns 100 for identical listening profiles", () => {
    const range = {
      artists: [{ id: "artist", rank: 1, genres: ["indie pop"] }],
      tracks: [{ id: "track", rank: 1 }],
    };
    const profile: CompatibilityProfile = {
      SHORT_TERM: range,
      MEDIUM_TERM: range,
      LONG_TERM: range,
    };

    expect(calculateCompatibility(profile, profile)).toMatchObject({
      overall: 100,
      artist: 100,
      track: 100,
      genre: 100,
    });
  });
});
