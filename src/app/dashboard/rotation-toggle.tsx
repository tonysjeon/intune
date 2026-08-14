"use client";

import Link from "next/link";
import { useState } from "react";

type RotationView = "artists" | "tracks";

export function RotationToggle({
  range,
  view,
}: {
  range: string;
  view: RotationView;
}) {
  const [selectedView, setSelectedView] = useState(view);

  return (
    <div
      aria-label="Rotation view"
      className="relative grid h-8 w-52 grid-cols-2 rounded-[10px] bg-[rgba(118,118,128,0.12)] p-0.5"
      role="tablist"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out ${selectedView === "tracks" ? "translate-x-full" : "translate-x-0"}`}
      />
      {(["artists", "tracks"] as const).map((option) => (
        <Link
          aria-current={view === option ? "page" : undefined}
          className={`relative z-10 flex items-center justify-center rounded-lg px-4 text-center text-[11.5px] leading-[15px] capitalize tracking-[-0.1px] transition-colors duration-300 ${selectedView === option ? "font-semibold text-zinc-950" : "font-medium text-zinc-500 hover:text-zinc-700"}`}
          href={`/dashboard?range=${range}&view=${option}`}
          key={option}
          onClick={() => setSelectedView(option)}
          role="tab"
          scroll={false}
        >
          {option === "tracks" ? "Songs" : "Artists"}
        </Link>
      ))}
    </div>
  );
}
