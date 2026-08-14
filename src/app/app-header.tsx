import Image from "next/image";
import Link from "next/link";

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
  const initials = (userName ?? "Account")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
            <Link className="text-base font-semibold text-white/55 transition hover:text-white" href="/compare">
              Taste Match
            </Link>
            <Link className="text-base font-semibold text-white/55 transition hover:text-white" href="/calendar">
              Calendar
            </Link>
          </div>
          <div className="col-start-2 row-start-1 flex items-center gap-6 justify-self-end sm:col-start-3 lg:gap-12">
            {spotifyAccount ? (
              <details className="group relative hidden md:block">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-emerald-700 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
                  Spotify connected
                </summary>
                <div className="invisible absolute right-0 top-full z-30 mt-3 w-72 -translate-y-1 rounded-2xl border border-zinc-200 bg-white p-4 opacity-0 shadow-lg shadow-black/5 transition-[opacity,transform] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <p className="text-sm font-semibold text-emerald-700">Spotify connected</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    InTune reads your Spotify profile and listening data to build private comparisons. Your authorization is encrypted and can be revoked anytime.
                  </p>
                  <form action={disconnectSpotify} className="mt-4">
                    <button className="text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900" type="submit">
                      Disconnect Spotify
                    </button>
                  </form>
                </div>
              </details>
            ) : null}
            <div className="flex items-center gap-2.5">
            {userImage ? (
              <Image alt="" className="h-7 w-7 rounded-full object-cover" height={28} sizes="28px" src={userImage} width={28} />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                {initials}
              </span>
            )}
            <span className="text-sm text-zinc-700">{userName ?? "Account"}</span>
            </div>
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
