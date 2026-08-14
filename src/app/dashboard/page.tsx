import { ListeningTimeRange } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { connectSpotify } from "@/app/actions/auth";
import { AppHeader } from "@/app/app-header";
import { auth } from "@/auth";
import { RotationToggle } from "@/app/dashboard/rotation-toggle";
import { SyncButton } from "@/app/dashboard/sync-button";
import { TimeRangeDropdown } from "@/app/dashboard/time-range-dropdown";
import { calculateBehavioralInsights, formatHour } from "@/lib/behavioral-insights";
import { db } from "@/lib/db";
import { formatRelativeTime } from "@/lib/relative-time";

const timeRanges = {
  short: { label: "1 month", value: ListeningTimeRange.SHORT_TERM },
  medium: { label: "6 months", value: ListeningTimeRange.MEDIUM_TERM },
  long: { label: "All time", value: ListeningTimeRange.LONG_TERM },
} as const;

type RangeKey = keyof typeof timeRanges;
type RotationView = "artists" | "tracks";

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
  const view: RotationView = query.view === "tracks" ? "tracks" : "artists";
  const [spotifyAccount, snapshot, latestSync, recentPlays, savedTrackCount] = await Promise.all([
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
    db.recentPlay.findMany({
      where: { userId: session.user.id },
      orderBy: { playedAt: "desc" },
      take: 50,
      include: {
        track: {
          include: {
            artists: { include: { artist: true }, orderBy: { position: "asc" } },
          },
        },
      },
    }),
    db.savedTrack.count({ where: { userId: session.user.id } }),
  ]);
  const grantedScopes = new Set(spotifyAccount?.scope?.split(" ") ?? []);
  const behavioralAccess =
    grantedScopes.has("user-read-recently-played") &&
    grantedScopes.has("user-library-read");
  const behavioralInsights = calculateBehavioralInsights(
    recentPlays.map(({ trackId, playedAt }) => ({ trackId, playedAt })),
  );
  const repeatedTrack = recentPlays.find(
    ({ trackId }) => trackId === behavioralInsights.mostRepeatedTrackId,
  )?.track;

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />

      <section className="mx-auto max-w-6xl py-16">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
              Your listening profile
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Welcome, {session.user.name?.split(" ")[0] ?? "listener"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 pb-1">
            {latestSync?.completedAt ? (
              <p className="text-xs text-white/35">
                Last synced {formatRelativeTime(latestSync.completedAt)}
              </p>
            ) : null}
            {spotifyAccount ? (
              behavioralAccess ? <SyncButton /> : (
                <form action={connectSpotify}>
                  <button className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200" type="submit">
                    Enable listening history
                  </button>
                </form>
              )
            ) : (
              <form action={connectSpotify}>
                <button className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200" type="submit">
                  Connect Spotify
                </button>
              </form>
            )}
          </div>
        </div>

        {snapshot ? (
          <section className="mt-16">
            <div className="border-b border-white/10 pb-6">
              <div className="grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
                <h2 className="text-3xl font-medium tracking-tight">Your rotation</h2>
                <RotationToggle key={view} range={range} view={view} />
                <TimeRangeDropdown range={range} view={view} />
              </div>
            </div>

            <div className="py-10" key={`${view}-${range}`}>
              {view === "artists" ? (
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {snapshot.topArtists.map(({ artist, rank }) => (
                    <li
                      className="rotation-card-enter flex min-w-0 items-center gap-4 rounded-2xl bg-white/[0.035] py-3 pl-6 pr-4"
                      key={artist.id}
                      style={{ animationDelay: `${Math.floor((rank - 1) / 3) * 24}ms` }}
                    >
                      <span className="rotation-content-enter w-6 shrink-0 translate-x-1.5 text-sm text-white/35">{rank}</span>
                      {artist.imageUrl ? (
                        <Image
                          alt=""
                          className="rotation-content-enter h-10 w-10 shrink-0 rounded-full object-cover"
                          height={40}
                          src={artist.imageUrl}
                          width={40}
                        />
                      ) : (
                        <span className="rotation-content-enter flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/20 text-sm text-violet-200">
                          {artist.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="rotation-content-enter min-w-0">
                        <p className="truncate font-medium">{artist.name}</p>
                        {artist.genres.length ? (
                          <p className="truncate text-xs text-white/35">
                            {artist.genres.slice(0, 2).join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {snapshot.topTracks.map(({ track, rank }) => (
                    <li
                      className="rotation-card-enter flex min-w-0 items-center gap-4 rounded-2xl bg-white/[0.035] py-3 pl-6 pr-4"
                      key={track.id}
                      style={{ animationDelay: `${Math.floor((rank - 1) / 3) * 24}ms` }}
                    >
                      <span className="rotation-content-enter w-6 shrink-0 translate-x-1.5 text-sm text-white/35">{rank}</span>
                      {track.albumImageUrl ? (
                        <Image
                          alt=""
                          className="rotation-content-enter h-10 w-10 shrink-0 rounded-xl object-cover"
                          height={40}
                          src={track.albumImageUrl}
                          width={40}
                        />
                      ) : (
                        <span className="rotation-content-enter flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/15 text-sm text-lime-200">
                          {track.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="rotation-content-enter min-w-0">
                        <p className="truncate font-medium">{track.name}</p>
                        <p className="truncate text-xs text-white/35">
                          {track.artists.map(({ artist }) => artist.name).join(", ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
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

        {behavioralAccess ? (
          <section className="mt-16 border-t border-white/10 pt-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-lime-300">Behavioral listening</p>
                <h2 className="mt-4 text-3xl font-medium tracking-tight">What you actually played</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                  Timestamped recent plays reveal repeat behavior and listening sessions. Your saved library currently contains {savedTrackCount.toLocaleString()} tracks.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 px-5 py-4">
                <p className="text-2xl font-semibold">{savedTrackCount.toLocaleString()}</p>
                <p className="text-xs text-white/35">saved tracks</p>
              </div>
            </div>
            <Link className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/30 hover:text-white" href="/calendar">
              Open listening calendar
            </Link>

            {recentPlays.length ? (
              <>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Unique tracks", behavioralInsights.uniqueTrackCount],
                    ["Repeat rate", `${behavioralInsights.repeatRate}%`],
                    ["Sessions", behavioralInsights.sessionCount],
                    ["Peak hour", formatHour(behavioralInsights.peakHour)],
                  ].map(([label, value]) => (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5" key={label}>
                      <p className="text-2xl font-semibold">{value}</p>
                      <p className="mt-1 text-xs text-white/35">{label}</p>
                    </article>
                  ))}
                </div>
                {repeatedTrack && behavioralInsights.mostRepeatedTrackCount > 1 ? (
                  <p className="mt-5 text-sm text-white/45">
                    Most repeated: <span className="text-white">{repeatedTrack.name}</span> with {behavioralInsights.mostRepeatedTrackCount} plays
                  </p>
                ) : null}
                <ol className="mt-8 grid gap-2 lg:grid-cols-2">
                {recentPlays.slice(0, 20).map(({ track, playedAt }) => (
                  <li className="flex items-center gap-4 rounded-2xl bg-white/[0.035] p-3" key={playedAt.toISOString()}>
                    {track.albumImageUrl ? (
                      <Image alt="" className="h-12 w-12 rounded-xl object-cover" height={48} src={track.albumImageUrl} width={48} />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{track.name}</p>
                      <p className="truncate text-xs text-white/35">{track.artists.map(({ artist }) => artist.name).join(", ")}</p>
                    </div>
                    <time className="text-right text-xs text-white/35" dateTime={playedAt.toISOString()}>
                      {playedAt.toLocaleDateString([], { weekday: "short" })}<br />
                      {playedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
                </ol>
              </>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-8 text-sm text-white/40">
                Sync again after granting access to import your latest Spotify plays and saved library.
              </div>
            )}
          </section>
        ) : null}

      </section>
    </main>
  );
}
