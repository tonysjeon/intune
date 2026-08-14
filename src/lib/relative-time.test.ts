import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-14T04:00:00.000Z");

  it("formats recent timestamps as just now", () => {
    expect(formatRelativeTime(new Date("2026-08-14T03:59:20.000Z"), now)).toBe("just now");
  });

  it("formats elapsed minutes, hours, and days", () => {
    expect(formatRelativeTime(new Date("2026-08-14T03:43:00.000Z"), now)).toBe("17 minutes ago");
    expect(formatRelativeTime(new Date("2026-08-14T02:00:00.000Z"), now)).toBe("2 hours ago");
    expect(formatRelativeTime(new Date("2026-08-12T04:00:00.000Z"), now)).toBe("2 days ago");
  });
});
