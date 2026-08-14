import Link from "next/link";
import { redirect } from "next/navigation";

import { connectSpotify, disconnectSpotify } from "@/app/actions/auth";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/");
  }

  const spotifyAccount = await db.account.findFirst({
    where: { userId: session.user.id, provider: "spotify" },
    select: { scope: true, updatedAt: true },
  });

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/10 pb-5">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          in<span className="text-lime-300">tune</span>
        </Link>
        <span className="text-sm text-white/45">{session.user.name}</span>
      </nav>

      <section className="mx-auto max-w-5xl py-20">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
          Your listening profile
        </p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
          Welcome, {session.user.name?.split(" ")[0] ?? "listener"}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/50">
          Your taste dashboard will take shape here as we sync top artists and
          tracks across Spotify&apos;s three listening ranges.
        </p>

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
      </section>
    </main>
  );
}
