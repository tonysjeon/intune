"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const ranges = {
  short: "1 month",
  medium: "6 months",
  long: "All time",
} as const;

type RangeKey = keyof typeof ranges;

export function TimeRangeDropdown({
  range,
  view,
}: {
  range: RangeKey;
  view: "artists" | "tracks";
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!detailsRef.current?.contains(event.target as Node)) {
        detailsRef.current?.removeAttribute("open");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        detailsRef.current?.removeAttribute("open");
        detailsRef.current?.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <details className="group relative w-36 justify-self-end" ref={detailsRef}>
      <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm shadow-black/5 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        {ranges[range]}
        <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg shadow-black/10">
        {Object.entries(ranges).map(([key, label]) => (
          <Link
            aria-current={range === key ? "page" : undefined}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs transition ${range === key ? "bg-zinc-100 font-semibold text-zinc-950" : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"}`}
            href={`/dashboard?range=${key}&view=${view}`}
            key={key}
            scroll={false}
          >
            <span>{label}</span>
            {range === key ? (
              <svg aria-hidden="true" className="h-3.5 w-3.5 text-zinc-600" fill="none" viewBox="0 0 16 16">
                <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
              </svg>
            ) : null}
          </Link>
        ))}
      </div>
    </details>
  );
}
