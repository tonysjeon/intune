import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { syncSpotifyListeningData } from "@/lib/listening-sync";
import { shouldRefreshListeningData } from "@/lib/listening-sync-policy";

export const dynamic = "force-dynamic";

function secretsMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function GET(request: Request) {
  const cronSecret = getServerEnv().CRON_SECRET;

  if (!cronSecret) {
    return Response.json({ error: "Scheduled sync is not configured" }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const receivedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!secretsMatch(receivedSecret, cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db.user.findMany({
    where: { accounts: { some: { provider: "spotify" } } },
    select: {
      id: true,
      accounts: {
        where: { provider: "spotify" },
        select: { scope: true },
        take: 1,
      },
      listeningSyncs: {
        orderBy: { startedAt: "desc" },
        select: { status: true, startedAt: true, completedAt: true },
        take: 1,
      },
    },
  });
  const eligibleUsers = users.filter((user) => {
    const scopes = new Set(user.accounts[0]?.scope?.split(" ") ?? []);
    const hasRequiredScopes =
      scopes.has("user-top-read") &&
      scopes.has("user-read-recently-played") &&
      scopes.has("user-library-read");

    return hasRequiredScopes && shouldRefreshListeningData(user.listeningSyncs[0] ?? null);
  });
  let completed = 0;
  let failed = 0;

  for (const user of eligibleUsers) {
    try {
      await syncSpotifyListeningData(user.id);
      completed += 1;
    } catch {
      failed += 1;
    }
  }

  return Response.json({ attempted: eligibleUsers.length, completed, failed });
}
