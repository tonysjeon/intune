import { describe, expect, it } from "vitest";

import { getCalendarDates, localDateKey } from "./listening-calendar";

describe("listening calendar", () => {
  it("builds a six-week calendar beginning on Sunday", () => {
    const dates = getCalendarDates(2026, 7);

    expect(dates).toHaveLength(42);
    expect(dates[0].getDay()).toBe(0);
    expect(dates.at(-1)?.getDay()).toBe(6);
    expect(dates.some((date) => date.getMonth() === 7 && date.getDate() === 31)).toBe(true);
  });

  it("creates a stable local date key", () => {
    expect(localDateKey(new Date(2026, 7, 3, 23, 30))).toBe("2026-08-03");
  });

  it("crosses year boundaries correctly", () => {
    const dates = getCalendarDates(2026, 0);

    expect(dates[0].getFullYear()).toBe(2025);
    expect(dates.some((date) => date.getFullYear() === 2026 && date.getMonth() === 0)).toBe(true);
  });
});
