import { SyncStatus } from "@prisma/client";

export const LISTENING_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const ACTIVE_SYNC_TIMEOUT_MS = 10 * 60 * 1000;

export interface ListeningSyncSummary {
  status: SyncStatus;
  startedAt: Date;
  completedAt: Date | null;
}

export function shouldRefreshListeningData(
  sync: ListeningSyncSummary | null,
  now = new Date(),
): boolean {
  if (!sync) return true;

  if (sync.status === SyncStatus.PROCESSING) {
    return now.getTime() - sync.startedAt.getTime() > ACTIVE_SYNC_TIMEOUT_MS;
  }

  if (sync.status === SyncStatus.FAILED || !sync.completedAt) return true;

  return now.getTime() - sync.completedAt.getTime() >= LISTENING_SYNC_INTERVAL_MS;
}
