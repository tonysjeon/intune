"use client";

import { useActionState } from "react";

import { analyzeComparisonAction } from "@/app/actions/comparisons";

export function AnalyzeButton({ comparisonId }: { comparisonId: string }) {
  const action = analyzeComparisonAction.bind(null, comparisonId);
  const [state, formAction, pending] = useActionState(action, { error: "" });

  return (
    <form action={formAction}>
      <button
        className="rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Analyzing…" : "Analyze compatibility"}
      </button>
      {state.error ? <p className="mt-3 text-sm text-red-300">{state.error}</p> : null}
    </form>
  );
}
