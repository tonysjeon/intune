"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  syncListeningData,
  type ListeningSyncState,
} from "@/app/actions/auth";

const initialState: ListeningSyncState = { status: "idle", message: "" };

export function SyncButton({
  lastSyncedLabel,
  successPlacement = "button",
}: {
  lastSyncedLabel?: string;
  successPlacement?: "button" | "dashboard";
}) {
  const [state, action] = useActionState(syncListeningData, initialState);
  const [dismissedSuccess, setDismissedSuccess] = useState<ListeningSyncState | null>(null);
  const showSuccess = state.status === "success" && dismissedSuccess !== state;

  useEffect(() => {
    if (state.status !== "success") return;

    const timeout = window.setTimeout(() => setDismissedSuccess(state), 3000);
    return () => window.clearTimeout(timeout);
  }, [state]);

  return (
    <form action={action} className={`${successPlacement === "button" ? "relative" : ""} ${successPlacement === "dashboard" ? "mr-2" : ""}`}>
      <div className="group relative">
        <SubmitButton hasLastSyncedLabel={Boolean(lastSyncedLabel)} />
        {lastSyncedLabel ? (
          <span
            className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-normal text-white/40 opacity-0 shadow-lg shadow-black/10 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            id="sync-last-updated"
            role="tooltip"
          >
            Last synced {lastSyncedLabel}
          </span>
        ) : null}
        {state.status === "error" ? (
          <p className="absolute right-0 top-full z-10 mt-2 w-max max-w-72 text-right text-xs text-rose-300" role="status">
            {state.message}
          </p>
        ) : null}
      </div>
      {showSuccess ? (
        <div className={`${successPlacement === "dashboard" ? "pointer-events-none absolute inset-x-0 top-2 flex justify-center" : "absolute right-0 top-full mt-2"} z-40`}>
          <p
            className={`${successPlacement === "dashboard" ? "sync-success-message" : ""} inline-flex w-max max-w-80 items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white/95 py-2 pl-2 pr-4 text-sm font-medium text-zinc-800 shadow-xl shadow-black/10 backdrop-blur-md`}
            role="status"
          >
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                <path d="m4 8.25 2.5 2.5L12 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
              </svg>
            </span>
            {state.message}
          </p>
        </div>
      ) : null}
    </form>
  );
}

function SubmitButton({ hasLastSyncedLabel }: { hasLastSyncedLabel: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-describedby={hasLastSyncedLabel ? "sync-last-updated" : undefined}
      className="inline-flex w-36 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-lime-300 px-3.5 py-2 text-sm font-medium text-neutral-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <svg aria-hidden="true" className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 5.5A5.5 5.5 0 1 0 13.2 10M13 2.5v3h-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
      {pending ? "Syncing…" : "Sync Data"}
    </button>
  );
}
