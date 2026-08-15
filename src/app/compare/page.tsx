import { ComparisonStatus, ListeningTimeRange } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "@/app/app-header";
import { CreateComparisonForm } from "@/app/dashboard/create-comparison-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatRelativeTime } from "@/lib/relative-time";

export default async function ComparePage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/");
  }

  const [hasListeningProfile, comparisons, comparisonCount] = await Promise.all([
    db.listeningSnapshot.findFirst({
      where: { userId: session.user.id, timeRange: ListeningTimeRange.MEDIUM_TERM },
      select: { id: true },
    }),
    db.comparison.findMany({
      where: {
        members: { some: { userId: session.user.id } },
        status: ComparisonStatus.COMPLETED,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
          select: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    db.comparison.count({
      where: {
        members: { some: { userId: session.user.id } },
        status: ComparisonStatus.COMPLETED,
      },
    }),
  ]);

  return (
    <main className="px-6 pt-6 sm:px-10 lg:px-16">
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />

      <section className="mx-auto max-w-6xl py-16">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
              Taste matching
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Find your music overlap
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/45">
              Turn two private listening profiles into shared favorites, compatibility insights, and songs worth sending.
            </p>
          </div>
        </div>

        {hasListeningProfile ? (
          <section className="mt-12 grid overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-lg shadow-black/5 lg:grid-cols-[1fr_0.75fr]">
            <div className="p-7 sm:p-9 lg:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-800">Private invitation</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight">Start a new comparison</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
                Your friend connects their own Spotify account and explicitly chooses whether to share their taste data.
              </p>
              <CreateComparisonForm />
            </div>
            <div className="border-t border-zinc-200 bg-zinc-50 p-7 sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">How it works</p>
              <ol className="mt-6 space-y-6">
                {[
                  ["1", "Create a private link"],
                  ["2", "Your friend opts in"],
                  ["3", "Explore your shared taste"],
                ].map(([number, label], index, steps) => (
                  <li className="relative flex items-center gap-4" key={number}>
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-[#fff]">{number}</span>
                    {index < steps.length - 1 ? <span aria-hidden="true" className="absolute left-[15px] top-8 h-6 w-0.5 bg-zinc-900" /> : null}
                    <span className="text-sm font-medium text-zinc-700">{label}</span>
                  </li>
                ))}
              </ol>
            </div>
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

        <section className="mt-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-300">Your matches</p>
              <h2 className="mt-3 text-3xl font-medium tracking-tight">Recent comparisons</h2>
            </div>
            {comparisonCount ? <span className="text-sm tabular-nums text-white/35">{comparisonCount}</span> : null}
          </div>
          {comparisons.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((comparison) => {
                const otherMember = comparison.members.find(({ user }) => user.id !== session.user.id);
                const name = otherMember?.user.name ?? "Waiting for a friend";
                const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                const statusLabel = comparison.status === ComparisonStatus.COMPLETED
                  ? "View match"
                  : comparison.status === ComparisonStatus.PENDING
                    ? "Waiting"
                    : comparison.status === ComparisonStatus.PROCESSING
                      ? "Analyzing"
                      : "Ready";
                return (
                  <Link
                    className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-lg hover:shadow-black/5"
                    href={`/comparisons/${comparison.id}`}
                    key={comparison.id}
                  >
                    <div className="flex items-center gap-3">
                      {otherMember?.user.image ? (
                        <Image alt="" className="h-10 w-10 rounded-full object-cover" height={40} src={otherMember.user.image} width={40} />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">{initials}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
                        <div className="relative mt-0.5 h-4">
                          <p className="absolute inset-0 text-xs text-zinc-400 transition-opacity group-hover:opacity-0">
                            {formatRelativeTime(comparison.createdAt)}
                          </p>
                          <p className="absolute inset-0 text-xs font-semibold text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                            {statusLabel} →
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-8 text-sm text-white/40">
              Your private comparisons will appear here after you create an invitation.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
