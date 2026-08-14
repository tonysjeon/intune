import { ComparisonStatus } from "@prisma/client";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Fragment, type CSSProperties } from "react";

import { auth } from "@/auth";
import { AppHeader } from "@/app/app-header";
import { AnalyzeButton } from "@/app/comparisons/[id]/analyze-button";
import { SharedCarousel } from "@/app/comparisons/[id]/shared-carousel";
import { TasteChangesChart } from "@/app/comparisons/[id]/taste-changes-chart";
import { ShareInvite } from "@/app/comparisons/[id]/share-invite";
import { SyncButton } from "@/app/dashboard/sync-button";
import { getComparisonForMember } from "@/lib/comparisons";
import type { CompatibilityResultJson } from "@/lib/compatibility-analysis";
import { db } from "@/lib/db";
import { formatRelativeTime } from "@/lib/relative-time";

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
    comparison.status === ComparisonStatus.FAILED;
  const result = comparison.results[0];
  const details = result?.resultJson as unknown as CompatibilityResultJson | undefined;

  return (
    <main className="px-6 pt-6 sm:px-10 lg:px-16">
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />

      <section className="mx-auto max-w-6xl py-16">
        <div className={result ? "flex flex-col gap-10 lg:flex-row lg:items-center" : ""}>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
              {result ? "Your taste match" : profilesReady ? "Ready to analyze" : "Waiting for your match"}
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              {result ? "Your compatibility result" : profilesReady ? "Both listening profiles are ready" : "Two listeners one shared result"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
              {result
                ? "See where your listening overlaps, how it changes over time, and what each of you should send next."
                : profilesReady
                  ? "Your listening data is synced. Run the analysis to reveal your shared taste."
                  : "Share the private invitation, then meet back here when both listening profiles are ready."}
            </p>
          </div>

          {result ? (
          <div className="shrink-0 self-center lg:ml-auto lg:mr-10 lg:self-auto">
            <p className="mb-3 text-right text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Analyzed {formatRelativeTime(result.generatedAt)}
            </p>
            <div className="flex items-center gap-8">
              <div
              aria-label={`${Math.round(result.overallScore)} percent compatible`}
              className="compatibility-meter order-2 flex h-36 w-36 shrink-0 items-center justify-center rounded-full sm:h-40 sm:w-40"
              role="img"
              style={{ "--compatibility-target": `${Math.round(result.overallScore)}%` } as CSSProperties}
            >
              <div className="flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center rounded-full bg-[#f4f4f5] sm:h-[8.5rem] sm:w-[8.5rem]">
                <span className="flex items-baseline font-semibold tracking-[-0.05em] text-zinc-900">
                  <span className="text-4xl sm:text-5xl">{Math.round(result.overallScore)}</span>
                  <span className="ml-0.5 text-xl sm:text-2xl">%</span>
                </span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">Compatible</span>
              </div>
            </div>

              <div className="order-1 flex min-w-0 flex-col">
              {comparison.members.map((member, position) => (
                <Fragment key={member.user.id}>
                  {position > 0 ? (
                    <div className="flex h-5 w-9 items-center justify-center sm:w-10" aria-hidden="true">
                      <span className="h-full w-px bg-zinc-500" />
                    </div>
                  ) : null}
                  <div className="flex min-w-0 items-center gap-2.5">
                    {member.user.image ? (
                      <Image alt="" className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10" height={40} src={member.user.image} width={40} />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-500 sm:h-10 sm:w-10">
                        {member.user.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
                      </span>
                    )}
                    <p className="max-w-24 truncate text-sm font-semibold text-zinc-900">{member.user.name ?? `Listener ${position + 1}`}</p>
                  </div>
                </Fragment>
              ))}
              </div>
            </div>
          </div>
          ) : null}
        </div>

        {!result ? (
          <div className="mt-12 flex flex-col justify-between gap-8 border-y border-zinc-200 py-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">Listening profiles</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight">Waiting for your match</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Both listening profiles need to be ready before the compatibility analysis can begin.</p>
            </div>
            <div className="flex shrink-0 flex-col sm:mr-24 lg:mr-36">
              {[0, 1].map((position) => {
                const member = comparison.members[position];
                const isSynced = member && syncedIds.has(member.user.id);
                return (
                  <Fragment key={member?.user.id ?? position}>
                    {position > 0 ? (
                      <div className="flex h-5 w-9 items-center justify-center sm:w-10" aria-hidden="true">
                        <span className="h-full w-px bg-zinc-500" />
                      </div>
                    ) : null}
                    <div className="flex min-w-0 items-center gap-2.5">
                      {member?.user.image ? (
                        <Image alt="" className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10" height={40} src={member.user.image} width={40} />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-500 sm:h-10 sm:w-10">
                          ?
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="max-w-36 truncate text-sm font-semibold text-zinc-900">{member?.user.name ?? "Waiting for a friend"}</p>
                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${isSynced ? "text-emerald-800" : "text-zinc-400"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSynced ? "bg-emerald-500" : "bg-zinc-300"}`} />
                          {member ? (isSynced ? "Profile ready" : "Sync needed") : "Invitation pending"}
                        </p>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        ) : null}

        {!profilesReady ? (
          <div className="mt-8 flex flex-col justify-between gap-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {comparison.members.length < 2 ? "Your private invitation is ready" : "One last listening sync is needed"}
              </p>
              <p className="mt-1 text-sm text-white/40">
                {comparison.members.length < 2 ? "Only someone with your link can join this comparison." : "Both profiles must be current before analysis can begin."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {comparison.members.length < 2 ? <ShareInvite inviteCode={comparison.inviteCode} /> : null}
              {!currentUserSynced ? <SyncButton /> : null}
            </div>
          </div>
        ) : null}

        {canAnalyze ? (
          <div className="mt-12 flex flex-col justify-between gap-6 rounded-[2rem] bg-zinc-900 p-8 text-white shadow-xl shadow-black/10 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">Compatibility engine</p>
              <h2 className="mt-3 text-2xl font-medium">Your match is ready to calculate</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Artists, tracks, and genres are compared across three listening windows.
              </p>
            </div>
            <div className="shrink-0"><AnalyzeButton comparisonId={comparison.id} /></div>
          </div>
        ) : null}

        {result && details ? (
          <section className="mt-16 space-y-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">Exact overlap</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight">The music you share</h2>
              <div className="mt-6 space-y-8">
                <SharedCarousel kind="artist" title="Shared artists" items={details.sharedArtists.map((artist) => ({ id: artist.id, name: artist.name, subtitle: "Artist", imageUrl: artist.imageUrl }))} />
                <SharedCarousel kind="track" title="Shared tracks" items={details.sharedTracks.map((track) => ({ id: track.id, name: track.name, subtitle: track.albumName, imageUrl: track.albumImageUrl }))} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">Score breakdown</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight">Where you connect</h2>
            </div>
            <dl className="grid grid-cols-3 border-y border-white/10 py-5">
              {[
                ["Artists", result.artistScore],
                ["Tracks", result.trackScore],
                ["Genres", result.genreScore],
              ].map(([label, score]) => (
                <div className="border-r border-white/10 px-4 first:pl-0 last:border-r-0 sm:px-8" key={label}>
                  <dd className="text-2xl font-semibold tracking-tight sm:text-3xl">{Math.round(Number(score))}%</dd>
                  <dt className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35 sm:text-xs">{label}</dt>
                </div>
              ))}
            </dl>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">Listening windows</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight">How your taste changes over time</h2>
              <TasteChangesChart
                artistScores={[
                  details.artistByRange.SHORT_TERM,
                  details.artistByRange.MEDIUM_TERM,
                  details.artistByRange.LONG_TERM,
                ]}
                trackScores={[
                  details.trackByRange.SHORT_TERM,
                  details.trackByRange.MEDIUM_TERM,
                  details.trackByRange.LONG_TERM,
                ]}
              />
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
                            <li className="rounded border border-white/10 bg-white/[0.025] p-4" key={track.id}>
                              <div className="flex items-center gap-4">
                                {track.albumImageUrl ? <Image alt="" className="h-14 w-14 rounded object-cover" height={56} src={track.albumImageUrl} width={56} /> : null}
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
