"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  syncListeningData,
  type ListeningSyncState,
} from "@/app/actions/auth";

const initialState: ListeningSyncState = { status: "idle", message: "" };

export function SyncButton() {
  const [state, action] = useActionState(syncListeningData, initialState);

  return (
    <form action={action} className="flex flex-col items-start gap-3 sm:items-end">
      <SubmitButton />
      {state.status !== "idle" ? (
        <p
          className={`text-xs ${state.status === "success" ? "text-lime-300" : "text-rose-300"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Syncing all ranges…" : "Sync listening data"}
    </button>
  );
}
