"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createComparisonAction,
  type ComparisonActionState,
} from "@/app/actions/comparisons";

const initialState: ComparisonActionState = { error: "" };

export function CreateComparisonForm() {
  const [state, action] = useActionState(createComparisonAction, initialState);

  return (
    <form action={action} className="mt-6">
      <label className="flex max-w-2xl items-start gap-3 text-sm leading-6 text-white/50">
        <input
          className="mt-1 h-4 w-4 accent-lime-300"
          name="consent"
          required
          type="checkbox"
        />
        I agree to share my top artists, tracks, and derived taste insights with
        the other member of this private comparison.
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <CreateButton />
        {state.error ? (
          <p className="text-sm text-rose-300" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creating invite…" : "Create taste comparison"}
    </button>
  );
}
