import { ListeningTimeRange } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { connectSpotify, disconnectSpotify } from "@/app/actions/auth";
import { auth } from "@/auth";
import { SyncButton } from "@/app/dashboard/sync-button";
import { CreateComparisonForm } from "@/app/dashboard/create-comparison-form";
import { db } from "@/lib/db";

const timeRanges = {
  short: { label: "4 weeks", value: ListeningTimeRange.SHORT_TERM },
  medium: { label: "6 months", value: ListeningTimeRange.MEDIUM_TERM },
  long: { label: "All time", value: ListeningTimeRange.LONG_TERM },
} as const;

type RangeKey = keyof typeof timeRanges;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/");
  }

  const query = await searchParams;
  const requestedRange = typeof query.range === "string" ? query.range : "medium";
  const range: RangeKey = requestedRange in timeRanges ? (requestedRange as RangeKey) : "medium";
  const [spotifyAccount, snapshot, latestSync, comparisons] = await Promise.all([
    db.account.findFirst({
      where: { userId: session.user.id, provider: "spotify" },
      select: { scope: true, updatedAt: true },
    }),
    db.listeningSnapshot.findFirst({
      where: { userId: session.user.id, timeRange: timeRanges[range].value },
      orderBy: { capturedAt: "desc" },
      include: {
        topArtists: {
          orderBy: { rank: "asc" },
          take: 50,
          include: { artist: true },
        },
        topTracks: {
          orderBy: { rank: "asc" },
          take: 50,
          include: { track: { include: { artists: { include: { artist: true }, orderBy: { position: "asc" } } } } },
        },
      },
    }),
    db.listeningSync.findFirst({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      select: { status: true, completedAt: true },
    }),
    db.comparison.findMany({
      where: { members: { some: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
          select: { user: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 pb-5">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          in<span className="text-lime-300">tune</span>
        </Link>
        <span className="text-sm text-white/45">{session.user.name}</span>
      </nav>

      <section className="mx-auto max-w-6xl py-16">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
              Your listening profile
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Welcome, {session.user.name?.split(" ")[0] ?? "listener"}
            </h1>
            {latestSync?.completedAt ? (
              <p className="mt-4 text-sm text-white/35">
                Last synced {latestSync.completedAt.toLocaleString()}
              </p>
            ) : null}
          </div>
          {spotifyAccount ? <SyncButton /> : null}
        </div>

        <article className="mt-12 grid gap-8 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${spotifyAccount ? "bg-lime-300" : "bg-white/25"}`}
              />
              <h2 className="text-xl font-medium">
                Spotify {spotifyAccount ? "connected" : "disconnected"}
              </h2>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
              {spotifyAccount
                ? "InTune can read your profile and top items. Your encrypted authorization can be revoked here at any time."
                : "Reconnect Spotify to continue building your listening profile and join comparisons."}
            </p>
          </div>

          {spotifyAccount ? (
            <form action={disconnectSpotify}>
              <button
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white"
                type="submit"
              >
                Disconnect
              </button>
            </form>
          ) : (
            <form action={connectSpotify}>
              <button
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200"
                type="submit"
              >
                Reconnect Spotify
              </button>
            </form>
          )}
        </article>

        {snapshot ? (
          <section className="mt-16">
            <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <h2 className="text-3xl font-medium tracking-tight">Your rotation</h2>
              <div className="flex gap-2" aria-label="Listening time range">
                {Object.entries(timeRanges).map(([key, option]) => (
                  <Link
                    className={`rounded-full px-4 py-2 text-xs transition ${range === key ? "bg-white text-neutral-950" : "bg-white/[0.05] text-white/50 hover:text-white"}`}
                    href={`/dashboard?range=${key}`}
                    key={key}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-12 py-10 lg:grid-cols-2">
              <div>
                <p className="mb-5 text-xs uppercase tracking-[0.2em] text-white/35">Top artists</p>
                <ol className="space-y-2">
                  {snapshot.topArtists.map(({ artist, rank }) => (
                    <li className="flex items-center gap-4 rounded-2xl bg-white/[0.035] px-4 py-3" key={artist.id}>
                      <span className="w-6 text-sm text-white/25">{rank}</span>
                      {artist.imageUrl ? (
                        <Image
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                          height={40}
                          src={artist.imageUrl}
                          width={40}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/20 text-sm text-violet-200">
                          {artist.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{artist.name}</p>
                        <p className="truncate text-xs text-white/35">
                          {artist.genres.slice(0, 2).join(" · ") || "Artist"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="mb-5 text-xs uppercase tracking-[0.2em] text-white/35">Top tracks</p>
                <ol className="space-y-2">
                  {snapshot.topTracks.map(({ track, rank }) => (
                    <li className="flex items-center gap-4 rounded-2xl bg-white/[0.035] px-4 py-3" key={track.id}>
                      <span className="w-6 text-sm text-white/25">{rank}</span>
                      {track.albumImageUrl ? (
                        <Image
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover"
                          height={40}
                          src={track.albumImageUrl}
                          width={40}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/15 text-sm text-lime-200">
                          {track.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{track.name}</p>
                        <p className="truncate text-xs text-white/35">
                          {track.artists.map(({ artist }) => artist.name).join(", ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ) : spotifyAccount ? (
          <section className="mt-16 rounded-3xl border border-dashed border-white/15 px-8 py-20 text-center">
            <h2 className="text-2xl font-medium">Your listening profile is ready to build</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/40">
              Sync Spotify to collect your top artists and tracks across all three listening ranges.
            </p>
          </section>
        ) : null}

        {snapshot ? (
          <section className="mt-16 border-t border-white/10 pt-12">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Taste match
            </p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight">
              Compare with a friend
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Create a private invitation. Your friend connects their own Spotify
              account and chooses whether to share their taste data.
            </p>
            <CreateComparisonForm />

            {comparisons.length ? (
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {comparisons.map((comparison) => {
                  const otherMember = comparison.members.find(
                    ({ user }) => user.id !== session.user.id,
                  );
                  return (
                    <Link
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:bg-white/[0.05]"
                      href={`/comparisons/${comparison.id}`}
                      key={comparison.id}
                    >
                      <p className="text-sm font-medium">
                        {otherMember?.user.name ?? "Waiting for a friend"}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/30">
                        {comparison.status.toLowerCase()}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
