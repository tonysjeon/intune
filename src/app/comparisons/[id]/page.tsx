import { ComparisonStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ShareInvite } from "@/app/comparisons/[id]/share-invite";
import { SyncButton } from "@/app/dashboard/sync-button";
import { getComparisonForMember } from "@/lib/comparisons";
import { db } from "@/lib/db";

export default async function ComparisonPage({
  params,
}: PageProps<"/comparisons/[id]">) {
  const session = await auth();

  if (!session?.user.id) {
    notFound();
  }

  const { id } = await params;
  const comparison = await getComparisonForMember(id, session.user.id);

  if (!comparison) {
    notFound();
  }

  const syncedMembers = await db.listeningSnapshot.groupBy({
    by: ["userId"],
    where: { userId: { in: comparison.members.map(({ user }) => user.id) } },
  });
  const syncedIds = new Set(syncedMembers.map(({ userId }) => userId));
  const currentUserSynced = syncedIds.has(session.user.id);
  const isReady = comparison.status === ComparisonStatus.READY;

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 pb-5">
        <Link className="text-xl font-semibold tracking-tight" href="/dashboard">
          in<span className="text-lime-300">tune</span>
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-white/35">
          Taste comparison
        </span>
      </nav>

      <section className="mx-auto max-w-5xl py-20">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
          {isReady ? "Ready to analyze" : "Waiting for your match"}
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {isReady ? "Both listening profiles are ready" : "Two listeners one shared result"}
        </h1>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((position) => {
            const member = comparison.members[position];
            return (
              <article
                className="rounded-3xl border border-white/10 bg-white/[0.035] p-7"
                key={member?.user.id ?? position}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                  Listener {position + 1}
                </p>
                <p className="mt-4 text-2xl font-medium">
                  {member?.user.name ?? "Waiting for a friend"}
                </p>
                <p className={`mt-2 text-sm ${member && syncedIds.has(member.user.id) ? "text-lime-300" : "text-white/35"}`}>
                  {member
                    ? syncedIds.has(member.user.id)
                      ? "Listening data synced"
                      : "Needs to sync listening data"
                    : "Invite not accepted yet"}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          {comparison.members.length < 2 ? (
            <ShareInvite inviteCode={comparison.inviteCode} />
          ) : null}
          {!currentUserSynced ? <SyncButton /> : null}
        </div>

        {isReady ? (
          <div className="mt-16 rounded-3xl border border-lime-300/20 bg-lime-300/[0.05] p-8">
            <h2 className="text-2xl font-medium">Compatibility analysis comes next</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Both profiles are ready for artist overlap, track overlap, genre similarity,
              and mutual recommendations.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
