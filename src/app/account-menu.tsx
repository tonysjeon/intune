"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { deleteAccount, signOutAccount } from "@/app/actions/auth";

export function AccountMenu({
  userImage,
  userName,
}: {
  userImage?: string | null;
  userName?: string | null;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const initials = (userName ?? "Account")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) {
        menu.open = false;
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !menuRef.current?.open) return;
      menuRef.current.open = false;
      menuRef.current.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <details className="group relative" ref={menuRef}>
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full outline-none ring-lime-400/50 transition hover:opacity-70 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
        {userImage ? (
          <Image alt="" className="h-7 w-7 rounded-full object-cover" height={28} sizes="28px" src={userImage} width={28} />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
            {initials}
          </span>
        )}
        <span className="hidden text-sm font-semibold text-zinc-700 sm:inline">{userName ?? "Account"}</span>
        <svg aria-hidden="true" className="h-3.5 w-3.5 text-zinc-400 transition group-open:rotate-180" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </summary>

      <div className="absolute right-0 top-full z-40 w-44 pt-3">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-black/10">
          <form action={signOutAccount}>
            <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100" type="submit">
              Sign out
            </button>
          </form>
          <div className="my-1 border-t border-zinc-100" />
          <form
            action={deleteAccount}
            onSubmit={(event) => {
              if (!window.confirm("Delete your InTune account and all stored listening and comparison data? This cannot be undone.")) {
                event.preventDefault();
              }
            }}
          >
            <button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50" type="submit">
              Delete account
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
