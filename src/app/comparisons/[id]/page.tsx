import { ComparisonStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AnalyzeButton } from "@/app/comparisons/[id]/analyze-button";
import { ShareInvite } from "@/app/comparisons/[id]/share-invite";
import { SyncButton } from "@/app/dashboard/sync-button";
import { getComparisonForMember } from "@/lib/comparisons";
import type { CompatibilityResultJson } from "@/lib/compatibility-analysis";
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
  const profilesReady = comparison.status !== ComparisonStatus.PENDING;
  const canAnalyze =
    comparison.status === ComparisonStatus.READY ||
    comparison.status === ComparisonStatus.FAILED ||
    comparison.status === ComparisonStatus.COMPLETED;
  const result = comparison.results[0];
  const details = result?.resultJson as unknown as CompatibilityResultJson | undefined;

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
          {result ? "Your taste match" : profilesReady ? "Ready to analyze" : "Waiting for your match"}
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
          {result ? `${Math.round(result.overallScore)}% compatible` : profilesReady ? "Both listening profiles are ready" : "Two listeners one shared result"}
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

        {canAnalyze ? (
          <div className="mt-16 rounded-3xl border border-lime-300/20 bg-lime-300/[0.05] p-8">
            <h2 className="text-2xl font-medium">{result ? "Refresh your compatibility" : "Your compatibility is ready to calculate"}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Compare ranked artists and tracks across three time ranges, plus the genres
              that connect your listening profiles.
            </p>
            <div className="mt-6"><AnalyzeButton comparisonId={comparison.id} hasResult={Boolean(result)} /></div>
          </div>
        ) : null}

        {result && details ? (
          <section className="mt-16 space-y-12">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Artists", result.artistScore],
                ["Tracks", result.trackScore],
                ["Genres", result.genreScore],
              ].map(([label, score]) => (
                <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-7" key={label}>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight">{Math.round(Number(score))}%</p>
                </article>
              ))}
            </div>

            <div>
              <h2 className="text-2xl font-medium">How your taste changes over time</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Last 4 weeks", "SHORT_TERM"],
                  ["Last 6 months", "MEDIUM_TERM"],
                  ["All time", "LONG_TERM"],
                ].map(([label, range]) => (
                  <div className="rounded-2xl border border-white/10 p-5" key={range}>
                    <p className="text-sm text-white/45">{label}</p>
                    <p className="mt-3 text-lg">{Math.round(details.artistByRange[range as keyof typeof details.artistByRange])}% artists · {Math.round(details.trackByRange[range as keyof typeof details.trackByRange])}% tracks</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <SharedList title="Shared artists" items={details.sharedArtists.map((artist) => ({ id: artist.id, name: artist.name, subtitle: "Artist", imageUrl: artist.imageUrl }))} round />
              <SharedList title="Shared tracks" items={details.sharedTracks.map((track) => ({ id: track.id, name: track.name, subtitle: track.albumName, imageUrl: track.albumImageUrl }))} />
            </div>

            {(details.recommendations ?? []).length ? (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-lime-300">Pass the aux</p>
                <h2 className="mt-3 text-3xl font-medium">What to send each other</h2>
                <div className="mt-7 grid gap-10 lg:grid-cols-2">
                  {details.recommendations.map((direction) => {
                    const sender = comparison.members.find(({ user }) => user.id === direction.fromUserId)?.user.name ?? "Listener";
                    const recipient = comparison.members.find(({ user }) => user.id === direction.toUserId)?.user.name ?? "friend";
                    return (
                      <div key={`${direction.fromUserId}:${direction.toUserId}`}>
                        <h3 className="text-lg font-medium">{sender} → {recipient}</h3>
                        <ol className="mt-4 space-y-3">
                          {direction.items.map((track) => (
                            <li className="rounded-2xl border border-white/10 bg-white/[0.025] p-4" key={track.id}>
                              <div className="flex items-center gap-4">
                                {track.albumImageUrl ? <Image alt="" className="h-14 w-14 rounded-xl object-cover" height={56} src={track.albumImageUrl} width={56} /> : null}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium">{track.name}</p>
                                  <p className="truncate text-xs text-white/35">{track.albumName}</p>
                                </div>
                                <span className="text-sm font-medium text-lime-300">{track.score}%</span>
                              </div>
                              <p className="mt-3 text-xs leading-5 text-white/40">{track.reasons.join(" · ")}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function SharedList({
  title,
  items,
  round = false,
}: {
  title: string;
  items: { id: string; name: string; subtitle: string; imageUrl: string | null }[];
  round?: boolean;
}) {
  return (
    <div>
      <h2 className="text-2xl font-medium">{title}</h2>
      {items.length ? (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li className="flex items-center gap-4 rounded-2xl bg-white/[0.035] p-3" key={item.id}>
              {item.imageUrl ? (
                <Image alt="" className={`h-12 w-12 object-cover ${round ? "rounded-full" : "rounded-xl"}`} height={48} src={item.imageUrl} width={48} />
              ) : (
                <span className={`flex h-12 w-12 items-center justify-center bg-white/10 ${round ? "rounded-full" : "rounded-xl"}`}>{item.name.slice(0, 1)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="truncate text-xs text-white/35">{item.subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/35">No exact matches in your six-month top list—the genre score can still reveal common ground.</p>
      )}
    </div>
  );
}
