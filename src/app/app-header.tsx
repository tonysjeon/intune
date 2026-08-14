import Image from "next/image";
import Link from "next/link";

import { AccountMenu } from "@/app/account-menu";
import { disconnectSpotify } from "@/app/actions/auth";
import { db } from "@/lib/db";

export async function AppHeader({
  userId,
  userName,
  userImage,
  label = "Spotify taste matching",
}: {
  userId?: string;
  userName?: string | null;
  userImage?: string | null;
  label?: string;
}) {
  const isAuthenticated = userName !== undefined;
  const spotifyAccount = userId
    ? await db.account.findFirst({
        where: { userId, provider: "spotify" },
        select: { id: true },
      })
    : null;
  return (
    <nav className="mx-auto grid w-full max-w-[78rem] grid-cols-[1fr_auto] items-center border-b border-white/10 px-2 py-5 sm:grid-cols-[auto_1fr_auto] sm:px-5 lg:px-8">
      <Link aria-label="InTune dashboard" className="inline-flex shrink-0 items-center gap-1.5 text-[22px] tracking-[-0.06em]" href={isAuthenticated ? "/dashboard" : "/"}>
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-zinc-950 bg-white text-zinc-950">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10.5V5.5M8 13V3M13 9V7" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
          </svg>
        </span>
        <span><span className="font-semibold text-zinc-500">in</span><span className="font-bold text-zinc-950" style={{ fontWeight: 750 }}>Tune</span></span>
      </Link>
      {isAuthenticated ? (
        <>
          <div className="col-span-2 row-start-2 mt-4 flex items-center gap-5 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:justify-self-center sm:gap-8">
            <Link className="text-base font-semibold text-zinc-950 transition hover:text-zinc-600" href="/compare">
              Taste Match
            </Link>
            <Link className="text-base font-semibold text-zinc-950 transition hover:text-zinc-600" href="/calendar">
              Calendar
            </Link>
          </div>
          <div className="col-start-2 row-start-1 flex items-center gap-6 justify-self-end sm:col-start-3 lg:gap-12">
            {spotifyAccount ? (
              <details className="group relative hidden md:block">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-emerald-800 [&::-webkit-details-marker]:hidden">
                  <Image alt="" height={21} src="/spotify-icon.svg" width={22} />
                  Connected
                </summary>
                <div className="invisible absolute left-1/2 top-full z-30 w-72 -translate-x-1/2 -translate-y-1 pt-3 opacity-0 transition-[opacity,transform] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10">
                    <p className="text-xs leading-5 text-white/40">
                      InTune reads your Spotify profile and listening data to build private comparisons. Your authorization is encrypted and can be revoked anytime.
                    </p>
                    <form action={disconnectSpotify} className="mt-4">
                      <button className="inline-flex rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200" type="submit">
                        Disconnect Spotify
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            ) : null}
            <AccountMenu userImage={userImage} userName={userName} />
          </div>
        </>
      ) : (
        <span className="col-start-3 justify-self-end text-xs uppercase tracking-[0.22em] text-white/45">
          {label}
        </span>
      )}
    </nav>
  );
}
