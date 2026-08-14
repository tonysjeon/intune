import { describe, expect, it } from "vitest";

import { ComparisonStatus } from "@prisma/client";

import { determineComparisonStatus, generateInviteCode } from "./comparisons";

describe("comparison invite codes", () => {
  it("generates URL-safe high-entropy codes", () => {
    const code = generateInviteCode();

    expect(code).toMatch(/^[A-Za-z0-9_-]{24}$/);
  });

  it("generates a different code for each invitation", () => {
    const codes = new Set(Array.from({ length: 20 }, generateInviteCode));

    expect(codes.size).toBe(20);
  });
});

describe("comparison readiness", () => {
  it("is ready only when both members have listening data", () => {
    expect(determineComparisonStatus(2, 2)).toBe(ComparisonStatus.READY);
  });

  it.each([
    [1, 1],
    [2, 1],
    [2, 0],
  ])("remains pending with %i members and %i synced members", (members, synced) => {
    expect(determineComparisonStatus(members, synced)).toBe(
      ComparisonStatus.PENDING,
    );
  });
});
