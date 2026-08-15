import { SyncStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  ACTIVE_SYNC_TIMEOUT_MS,
  LISTENING_SYNC_INTERVAL_MS,
  shouldRefreshListeningData,
} from "./listening-sync-policy";

const now = new Date("2026-08-14T12:00:00.000Z");

describe("listening sync policy", () => {
  it("refreshes missing, failed, and stale data", () => {
    expect(shouldRefreshListeningData(null, now)).toBe(true);
    expect(shouldRefreshListeningData({
      status: SyncStatus.FAILED,
      startedAt: now,
      completedAt: now,
    }, now)).toBe(true);
    expect(shouldRefreshListeningData({
      status: SyncStatus.COMPLETED,
      startedAt: now,
      completedAt: new Date(now.getTime() - LISTENING_SYNC_INTERVAL_MS),
    }, now)).toBe(true);
  });

  it("keeps fresh and actively processing data", () => {
    expect(shouldRefreshListeningData({
      status: SyncStatus.COMPLETED,
      startedAt: now,
      completedAt: new Date(now.getTime() - LISTENING_SYNC_INTERVAL_MS + 1),
    }, now)).toBe(false);
    expect(shouldRefreshListeningData({
      status: SyncStatus.PROCESSING,
      startedAt: new Date(now.getTime() - ACTIVE_SYNC_TIMEOUT_MS + 1),
      completedAt: null,
    }, now)).toBe(false);
  });
});
