import { describe, expect, it } from "vitest";

import { calculateBehavioralInsights, formatHour } from "./behavioral-insights";

describe("behavioral listening insights", () => {
  it("detects sessions separated by more than thirty minutes", () => {
    const insights = calculateBehavioralInsights([
      { trackId: "one", playedAt: new Date("2026-08-13T20:00:00") },
      { trackId: "two", playedAt: new Date("2026-08-13T20:20:00") },
      { trackId: "three", playedAt: new Date("2026-08-13T21:00:01") },
    ]);

    expect(insights.sessionCount).toBe(2);
  });

  it("calculates repeats and the peak listening hour", () => {
    const insights = calculateBehavioralInsights([
      { trackId: "repeat", playedAt: new Date("2026-08-13T20:00:00") },
      { trackId: "repeat", playedAt: new Date("2026-08-13T20:04:00") },
      { trackId: "other", playedAt: new Date("2026-08-13T21:00:00") },
    ]);

    expect(insights).toMatchObject({
      uniqueTrackCount: 2,
      repeatRate: 33,
      peakHour: 20,
      mostRepeatedTrackId: "repeat",
      mostRepeatedTrackCount: 2,
    });
    expect(formatHour(insights.peakHour)).toBe("8 PM");
  });
});
