import { randomBytes } from "node:crypto";
import { ComparisonStatus } from "@prisma/client";

import { db } from "@/lib/db";

export const CONSENT_VERSION = "2026-08-13";

export class ComparisonEligibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonEligibilityError";
  }
}

export function generateInviteCode(): string {
  return randomBytes(18).toString("base64url");
}

export async function createComparisonForUser(
  userId: string,
  consentVersion: string,
) {
  if (consentVersion !== CONSENT_VERSION) {
    throw new ComparisonEligibilityError("Current comparison consent is required");
  }

  const [spotifyAccount, snapshotCount] = await Promise.all([
    db.account.count({ where: { userId, provider: "spotify" } }),
    db.listeningSnapshot.count({ where: { userId } }),
  ]);

  if (!spotifyAccount) {
    throw new ComparisonEligibilityError("Connect Spotify before creating a comparison");
  }

  if (!snapshotCount) {
    throw new ComparisonEligibilityError(
      "Sync your listening data before creating a comparison",
    );
  }

  return db.comparison.create({
    data: {
      createdByUserId: userId,
      inviteCode: generateInviteCode(),
      status: ComparisonStatus.PENDING,
      members: {
        create: { userId, consentVersion },
      },
    },
    select: {
      id: true,
      inviteCode: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getComparisonForMember(comparisonId: string, userId: string) {
  return db.comparison.findFirst({
    where: {
      id: comparisonId,
      members: { some: { userId } },
    },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          joinedAt: true,
          consentVersion: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
}
