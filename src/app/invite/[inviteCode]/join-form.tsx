"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  joinComparisonAction,
  type ComparisonActionState,
} from "@/app/actions/comparisons";

const initialState: ComparisonActionState = { error: "" };

export function JoinForm({ inviteCode }: { inviteCode: string }) {
  const [state, action] = useActionState(joinComparisonAction, initialState);

  return (
    <form action={action} className="mt-8">
      <input name="inviteCode" type="hidden" value={inviteCode} />
      <label className="flex items-start gap-3 text-sm leading-6 text-white/55">
        <input
          className="mt-1 h-4 w-4 accent-lime-300"
          name="consent"
          required
          type="checkbox"
        />
        I agree to share my top artists, tracks, and derived taste insights with
        the other member of this private comparison.
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <JoinButton />
        {state.error ? (
          <p className="text-sm text-rose-300" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function JoinButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Joining comparison…" : "Join taste comparison"}
    </button>
  );
}
