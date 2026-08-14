import { describe, expect, it } from "vitest";

import { generateInviteCode } from "./comparisons";

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
