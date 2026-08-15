"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createComparisonAction,
  type ComparisonActionState,
} from "@/app/actions/comparisons";

const initialState: ComparisonActionState = { error: "" };

export function CreateComparisonForm() {
  const [state, action] = useActionState(createComparisonAction, initialState);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);

  return (
    <form
      action={action}
      className="mt-6"
      onSubmit={(event) => {
        if (consentChecked) return;
        event.preventDefault();
        setConsentError(true);
      }}
    >
      <label className={`flex max-w-2xl items-start gap-3 text-sm leading-6 transition ${consentError ? "text-rose-800" : "text-white/50"}`}>
        <input
          aria-describedby={consentError ? "comparison-consent-error" : undefined}
          aria-invalid={consentError}
          className="mt-1 h-4 w-4 accent-lime-300"
          checked={consentChecked}
          name="consent"
          onChange={(event) => {
            setConsentChecked(event.target.checked);
            if (event.target.checked) setConsentError(false);
          }}
          type="checkbox"
        />
        I agree to share my top artists, tracks, and derived taste insights with
        the other member of this private comparison.
      </label>
      {consentError ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-700" id="comparison-consent-error" role="alert">
          <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100">!</span>
          Select the consent box before creating a taste comparison.
        </p>
      ) : null}
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
