"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

import {
  connectSpotify,
  syncListeningData,
  type ListeningSyncState,
} from "@/app/actions/auth";

const initialState: ListeningSyncState = { status: "idle", message: "" };

export function AutoSync() {
  const [state, action, pending] = useActionState(syncListeningData, initialState);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startTransition(() => action());
  }, [action]);

  if (state.status === "error") {
    return (
      <div className="absolute inset-x-0 top-2 z-40 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/95 py-2 pl-4 pr-2 text-sm text-zinc-700 shadow-xl shadow-black/10 backdrop-blur-md">
          <span>{state.message}</span>
          {state.requiresReauthorization ? (
            <form action={connectSpotify}>
              <button className="rounded-full bg-lime-300 px-3 py-1.5 text-xs font-medium text-neutral-950 transition hover:bg-lime-200" type="submit">
                Reconnect
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return pending ? <span className="sr-only" role="status">Updating Spotify data</span> : null;
}
