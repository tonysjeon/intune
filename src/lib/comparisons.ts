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

export class ComparisonJoinError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonJoinError";
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

export async function getInvitePreview(inviteCode: string) {
  return db.comparison.findUnique({
    where: { inviteCode },
    select: {
      inviteCode: true,
      status: true,
      createdAt: true,
      createdBy: { select: { name: true, image: true } },
      _count: { select: { members: true } },
    },
  });
}

export async function joinComparison(
  inviteCode: string,
  userId: string,
  consentVersion: string,
) {
  if (consentVersion !== CONSENT_VERSION) {
    throw new ComparisonJoinError("Current comparison consent is required");
  }

  const spotifyAccount = await db.account.count({
    where: { userId, provider: "spotify" },
  });

  if (!spotifyAccount) {
    throw new ComparisonJoinError("Connect Spotify before joining a comparison");
  }

  const comparison = await db.$transaction(async (transaction) => {
    const invitation = await transaction.comparison.findUnique({
      where: { inviteCode },
      include: { members: { select: { userId: true } } },
    });

    if (!invitation) {
      throw new ComparisonJoinError("This comparison invitation does not exist");
    }

    const existingMember = invitation.members.some((member) => member.userId === userId);

    if (!existingMember) {
      if (invitation.members.length >= 2) {
        throw new ComparisonJoinError("This comparison already has two members");
      }

      await transaction.comparisonMember.create({
        data: { comparisonId: invitation.id, userId, consentVersion },
      });
    }

    return invitation;
  });

  await refreshComparisonReadiness(comparison.id);
  return db.comparison.findUniqueOrThrow({ where: { id: comparison.id } });
}

export function determineComparisonStatus(
  memberCount: number,
  syncedMemberCount: number,
): ComparisonStatus {
  return memberCount === 2 && syncedMemberCount === 2
    ? ComparisonStatus.READY
    : ComparisonStatus.PENDING;
}

export async function refreshComparisonReadiness(comparisonId: string) {
  const comparison = await db.comparison.findUnique({
    where: { id: comparisonId },
    select: { status: true, members: { select: { userId: true } } },
  });

  if (!comparison || comparison.status === ComparisonStatus.COMPLETED) {
    return;
  }

  const memberIds = comparison.members.map((member) => member.userId);
  const syncedMembers = await db.listeningSnapshot.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds } },
  });
  const status = determineComparisonStatus(memberIds.length, syncedMembers.length);

  if (status !== comparison.status) {
    await db.comparison.update({ where: { id: comparisonId }, data: { status } });
  }
}

export async function refreshComparisonsForUser(userId: string) {
  const memberships = await db.comparisonMember.findMany({
    where: { userId },
    select: { comparisonId: true },
  });

  await Promise.all(
    memberships.map(({ comparisonId }) => refreshComparisonReadiness(comparisonId)),
  );
}
