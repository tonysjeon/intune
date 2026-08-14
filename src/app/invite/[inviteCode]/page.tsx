import Link from "next/link";
import { notFound } from "next/navigation";

import { connectSpotifyFromInvite } from "@/app/actions/comparisons";
import { auth } from "@/auth";
import { JoinForm } from "@/app/invite/[inviteCode]/join-form";
import { db } from "@/lib/db";
import { getInvitePreview } from "@/lib/comparisons";

export default async function InvitePage({
  params,
}: PageProps<"/invite/[inviteCode]">) {
  const { inviteCode } = await params;
  const [invitation, session] = await Promise.all([
    getInvitePreview(inviteCode),
    auth(),
  ]);

  if (!invitation) {
    notFound();
  }

  const spotifyAccount = session?.user.id
    ? await db.account.count({
        where: { userId: session.user.id, provider: "spotify" },
      })
    : 0;
  const isFull = invitation._count.members >= 2;

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-3xl items-center justify-between border-b border-white/10 pb-5">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          in<span className="text-lime-300">tune</span>
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-white/35">
          Private invitation
        </span>
      </nav>

      <section className="mx-auto max-w-3xl py-24">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-lime-300">
          You&apos;re invited
        </p>
        <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">
          {invitation.createdBy.name ?? "A friend"} wants to compare music taste
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">
          Connect your own Spotify account and explicitly choose whether to share
          your listening profile in this private two-person comparison.
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          {isFull ? (
            <p className="text-white/60">This comparison already has two members.</p>
          ) : session && spotifyAccount ? (
            <JoinForm inviteCode={inviteCode} />
          ) : (
            <form action={connectSpotifyFromInvite}>
              <input name="inviteCode" type="hidden" value={inviteCode} />
              <button
                className="rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200"
                type="submit"
              >
                {session ? "Reconnect Spotify to continue" : "Connect Spotify to continue"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
