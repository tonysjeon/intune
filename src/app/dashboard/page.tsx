import { ListeningTimeRange } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { connectSpotify } from "@/app/actions/auth";
import { AppHeader } from "@/app/app-header";
import { auth } from "@/auth";
import { AutoSync } from "@/app/dashboard/auto-sync";
import { RotationToggle } from "@/app/dashboard/rotation-toggle";
import { TimeRangeDropdown } from "@/app/dashboard/time-range-dropdown";
import { calculateBehavioralInsights, formatHour } from "@/lib/behavioral-insights";
import { db } from "@/lib/db";
import { shouldRefreshListeningData } from "@/lib/listening-sync-policy";

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
  const [spotifyAccount, snapshot, latestSync, recentPlays] = await Promise.all([
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
      select: { status: true, startedAt: true, completedAt: true },
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
  ]);
  const grantedScopes = new Set(spotifyAccount?.scope?.split(" ") ?? []);
  const behavioralAccess =
    grantedScopes.has("user-read-recently-played") &&
    grantedScopes.has("user-library-read");
  const shouldAutoSync = behavioralAccess && shouldRefreshListeningData(latestSync);
  const behavioralInsights = calculateBehavioralInsights(
    recentPlays.map(({ trackId, playedAt }) => ({ trackId, playedAt })),
  );
  const repeatedTrack = recentPlays.find(
    ({ trackId }) => trackId === behavioralInsights.mostRepeatedTrackId,
  )?.track;
  const seenLatestTrackIds = new Set<string>();
  const latestUniquePlays = recentPlays.filter(({ trackId }) => {
    if (seenLatestTrackIds.has(trackId)) return false;
    seenLatestTrackIds.add(trackId);
    return true;
  }).slice(0, 8);

  return (
    <main className="px-6 pt-6 sm:px-10 lg:px-16">
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />

      <section className="relative mx-auto max-w-6xl py-16">
        {shouldAutoSync ? <AutoSync /> : null}
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
              Listening activity
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Your listening profile
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 pb-1">
            {spotifyAccount ? (
              behavioralAccess ? null : (
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

        {behavioralAccess ? (
          <section className="mt-16 border-b border-white/10 pb-16">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-medium tracking-tight">Recent listening</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                  A snapshot of your latest {behavioralInsights.playCount} Spotify plays.
                </p>
              </div>
              {repeatedTrack && behavioralInsights.mostRepeatedTrackCount > 1 ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                  <p className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">On repeat</p>
                  <a
                    className="group flex w-full items-stretch rounded bg-white/[0.035] transition hover:bg-white/[0.05] sm:w-[17.625rem]"
                    href={`https://open.spotify.com/track/${repeatedTrack.id}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {repeatedTrack.albumImageUrl ? (
                      <Image alt="" className="h-16 w-16 shrink-0 rounded object-cover" height={64} src={repeatedTrack.albumImageUrl} width={64} />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-lime-300/15 text-sm text-lime-200">{repeatedTrack.name.slice(0, 1)}</span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
                      <p className="truncate text-sm font-semibold">{repeatedTrack.name}</p>
                      <div className="relative h-4">
                        <p className="truncate text-[11px] text-white/35 transition-opacity group-hover:opacity-0">
                          {repeatedTrack.artists.map(({ artist }) => artist.name).join(", ")}
                        </p>
                        <p className="absolute inset-0 flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                          <Image alt="" height={12} src="/spotify-icon.svg" width={13} />
                          Open in Spotify ↗
                        </p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center pr-3 text-xs text-white/35">{behavioralInsights.mostRepeatedTrackCount} plays</span>
                  </a>
                </div>
              ) : null}
            </div>

            {recentPlays.length ? (
              <>
                <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-white/10 py-5 lg:grid-cols-4">
                  {[
                    ["Unique tracks", behavioralInsights.uniqueTrackCount],
                    ["Repeat rate", `${behavioralInsights.repeatRate}%`],
                    ["Sessions", behavioralInsights.sessionCount],
                    ["Peak hour", formatHour(behavioralInsights.peakHour)],
                  ].map(([label, value]) => (
                    <div className="flex items-baseline justify-between gap-3 lg:block" key={label}>
                      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35 lg:mt-1">{label}</dt>
                      <dd className="order-first text-xl font-semibold tracking-tight lg:text-2xl">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold">Latest plays</h3>
                  <Link className="text-sm font-medium text-white/55 transition hover:text-white" href="/calendar">
                    View full activity
                  </Link>
                </div>
                <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {latestUniquePlays.map(({ track, playedAt }) => (
                    <li key={playedAt.toISOString()}>
                      <a
                        className="group flex items-stretch rounded bg-white/[0.035] transition hover:bg-white/[0.05]"
                        href={`https://open.spotify.com/track/${track.id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {track.albumImageUrl ? (
                          <Image alt="" className="h-16 w-16 shrink-0 rounded object-cover" height={64} src={track.albumImageUrl} width={64} />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-lime-300/15 text-sm text-lime-200">{track.name.slice(0, 1)}</span>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
                          <p className="truncate text-sm font-semibold">{track.name}</p>
                          <div className="relative h-4">
                            <p className="truncate text-[11px] text-white/35 transition-opacity group-hover:opacity-0">{track.artists.map(({ artist }) => artist.name).join(", ")}</p>
                            <p className="absolute inset-0 flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                              <Image alt="" height={12} src="/spotify-icon.svg" width={13} />
                              Open in Spotify ↗
                            </p>
                          </div>
                        </div>
                      </a>
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
                      className={`rotation-card-enter min-w-0 ${rank <= 3 ? "lg:mb-2" : ""}`}
                      key={artist.id}
                      style={{ animationDelay: `${Math.floor((rank - 1) / 3) * 70}ms` }}
                    >
                      <a
                        className={`group flex min-w-0 flex-1 items-stretch rounded bg-white/[0.035] transition hover:bg-white/[0.05] ${rank <= 3 ? "lg:min-h-24 lg:rounded-lg lg:shadow-lg lg:shadow-black/10 lg:ring-1 lg:ring-zinc-200" : ""}`}
                        href={`https://open.spotify.com/artist/${artist.id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="shrink-0">
                          {artist.imageUrl ? (
                            <Image
                              alt=""
                              className={`rotation-content-enter shrink-0 rounded object-cover ${rank <= 3 ? "h-16 w-16 lg:h-24 lg:w-24 lg:rounded-lg" : "h-16 w-16"}`}
                              height={rank <= 3 ? 96 : 64}
                              src={artist.imageUrl}
                              width={rank <= 3 ? 96 : 64}
                            />
                          ) : (
                            <span className={`rotation-content-enter flex shrink-0 items-center justify-center bg-violet-400/20 text-sm text-violet-200 ${rank <= 3 ? "h-16 w-16 lg:h-24 lg:w-24" : "h-16 w-16"}`}>
                              {artist.name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="rotation-content-enter flex min-w-0 flex-1 items-center px-4 py-2">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className={`w-4 shrink-0 text-center font-semibold leading-5 tabular-nums text-zinc-400 ${rank <= 3 ? "text-sm" : "text-xs"}`}>
                              {rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-5">{artist.name}</p>
                              <div className="relative h-4">
                                <p className="truncate text-xs text-white/35 transition-opacity group-hover:opacity-0">
                                  {artist.genres.length ? artist.genres.slice(0, 2).join(" · ") : "Artist"}
                                </p>
                                <p className="absolute inset-0 flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Image alt="" height={13} src="/spotify-icon.svg" width={14} />
                                  Open in Spotify ↗
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {snapshot.topTracks.map(({ track, rank }) => (
                    <li
                      className={`rotation-card-enter min-w-0 ${rank <= 3 ? "lg:mb-2" : ""}`}
                      key={track.id}
                      style={{ animationDelay: `${Math.floor((rank - 1) / 3) * 70}ms` }}
                    >
                      <a
                        className={`group flex min-w-0 flex-1 items-stretch rounded bg-white/[0.035] transition hover:bg-white/[0.05] ${rank <= 3 ? "lg:min-h-24 lg:rounded-lg lg:shadow-lg lg:shadow-black/10 lg:ring-1 lg:ring-zinc-200" : ""}`}
                        href={`https://open.spotify.com/track/${track.id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <div className="shrink-0">
                          {track.albumImageUrl ? (
                            <Image
                              alt=""
                              className={`rotation-content-enter shrink-0 rounded object-cover ${rank <= 3 ? "h-16 w-16 lg:h-24 lg:w-24 lg:rounded-lg" : "h-16 w-16"}`}
                              height={rank <= 3 ? 96 : 64}
                              src={track.albumImageUrl}
                              width={rank <= 3 ? 96 : 64}
                            />
                          ) : (
                            <span className={`rotation-content-enter flex shrink-0 items-center justify-center bg-lime-300/15 text-sm text-lime-200 ${rank <= 3 ? "h-16 w-16 lg:h-24 lg:w-24" : "h-16 w-16"}`}>
                              {track.name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="rotation-content-enter flex min-w-0 flex-1 items-center px-4 py-2">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className={`w-4 shrink-0 text-center font-semibold leading-5 tabular-nums text-zinc-400 ${rank <= 3 ? "text-sm" : "text-xs"}`}>
                              {rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold leading-5">{track.name}</p>
                              <div className="relative h-4">
                                <p className="truncate text-[11px] text-white/35 transition-opacity group-hover:opacity-0">
                                  {track.artists.map(({ artist }) => artist.name).join(", ")}
                                </p>
                                <p className="absolute inset-0 flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Image alt="" height={12} src="/spotify-icon.svg" width={13} />
                                  Open in Spotify ↗
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a>
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

      </section>
    </main>
  );
}
