import { ListeningTimeRange } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/app/app-header";
import { CreateComparisonForm } from "@/app/dashboard/create-comparison-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function ComparePage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/");
  }

  const [hasListeningProfile, comparisons] = await Promise.all([
    db.listeningSnapshot.findFirst({
      where: { userId: session.user.id, timeRange: ListeningTimeRange.MEDIUM_TERM },
      select: { id: true },
    }),
    db.comparison.findMany({
      where: { members: { some: { userId: session.user.id } } },
      orderBy: { createdAt: "desc" },
      take: 12,
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
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />

      <section className="mx-auto max-w-6xl py-16">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
          Taste match
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
          Compare with a friend
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
          Create a private invitation and find the overlap between two listening profiles.
        </p>

        {hasListeningProfile ? (
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
            <h2 className="text-2xl font-medium tracking-tight">Start a new comparison</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Your friend will connect their own Spotify account and choose whether to share their taste data.
            </p>
            <CreateComparisonForm />
          </section>
        ) : (
          <section className="mt-12 rounded-3xl border border-dashed border-white/15 p-8">
            <h2 className="text-2xl font-medium tracking-tight">Sync your profile first</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
              We need your listening profile before we can make a private comparison.
            </p>
            <Link className="mt-6 inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200" href="/dashboard">
              Go to dashboard
            </Link>
          </section>
        )}

        <section className="mt-16 border-t border-white/10 pt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-medium tracking-tight">Your comparisons</h2>
            {comparisons.length ? <span className="text-sm text-white/35">{comparisons.length}</span> : null}
          </div>
          {comparisons.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((comparison) => {
                const otherMember = comparison.members.find(({ user }) => user.id !== session.user.id);
                return (
                  <Link
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:bg-white/[0.05]"
                    href={`/comparisons/${comparison.id}`}
                    key={comparison.id}
                  >
                    <p className="text-sm font-medium">{otherMember?.user.name ?? "Waiting for a friend"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/30">
                      {comparison.status.toLowerCase()}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/40">Your private comparisons will appear here.</p>
          )}
        </section>
      </section>
    </main>
  );
}
