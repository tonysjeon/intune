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
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
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
      className="inline-flex items-center gap-2 rounded-full bg-lime-300 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <svg aria-hidden="true" className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 5.5A5.5 5.5 0 1 0 13.2 10M13 2.5v3h-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
      </svg>
      {pending ? "Syncing…" : "Sync Data"}
    </button>
  );
}
