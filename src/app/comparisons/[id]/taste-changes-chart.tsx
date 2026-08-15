"use client";

import { Fragment, useEffect, useRef, useState } from "react";

export function TasteChangesChart({
  artistScores,
  trackScores,
}: {
  artistScores: number[];
  trackScores: number[];
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const labels = ["4 weeks", "6 months", "All time"];
  const xPositions = [150, 360, 570];
  const allScores = [...artistScores, ...trackScores];
  const lowestScore = Math.min(...allScores);
  const highestScore = Math.max(...allScores);
  const scoreSpread = Math.max(highestScore - lowestScore, 10);
  const scorePadding = Math.max(2, Math.ceil(scoreSpread * 0.2));
  const chartMinimum = Math.max(0, lowestScore - scorePadding);
  const chartMaximum = Math.min(100, highestScore + scorePadding);
  const chartRange = chartMaximum - chartMinimum || 1;
  const axisTicks = [chartMaximum, chartMinimum + chartRange / 2, chartMinimum];
  const pointY = (score: number) => 180 - Math.round(((score - chartMinimum) / chartRange) * 145);
  const barHeight = (score: number) => 180 - pointY(score);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const observer = new IntersectionObserver(([entry]) => {
      setHasEntered(entry.isIntersecting);
    }, { threshold: 0.3 });
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`mx-auto mt-7 max-w-3xl border-y border-white/10 py-6 ${hasEntered ? "taste-chart-animate" : ""}`} ref={chartRef}>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium">
        <span className="flex items-center gap-2 text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" />Artists</span>
        <span className="flex items-center gap-2 text-zinc-600"><span className="h-2 w-2 rounded-full bg-zinc-700" />Tracks</span>
        <span className="text-zinc-400">Overlap by listening period</span>
      </div>
      <svg aria-label="Artist and track overlap across listening periods" className="mt-6 h-auto w-full overflow-visible" role="img" viewBox="0 0 720 240">
        {[35, 108, 180].map((y, index) => (
          <g key={y}>
            <line className="stroke-zinc-200" strokeDasharray="3 5" x1="52" x2="680" y1={y} y2={y} />
            <text className="fill-zinc-400 text-[11px] font-medium" textAnchor="end" x="40" y={y + 4}>{Math.round(axisTicks[index])}%</text>
          </g>
        ))}
        <line className="stroke-zinc-300" strokeWidth="1.5" x1="52" x2="680" y1="180" y2="180" />
        <line className="stroke-zinc-300" strokeWidth="1.5" x1="52" x2="52" y1="22" y2="180" />
        {artistScores.map((score, index) => (
          <Fragment key={`artist-${labels[index]}`}>
            <rect className="taste-chart-bar taste-chart-artists" height={barHeight(score)} rx="2" style={{ animationDelay: `${160 + index * 90}ms` }} width="36" x={xPositions[index] - 38} y={pointY(score)} />
            <text className="taste-chart-value fill-emerald-800 text-[10px] font-semibold" textAnchor="middle" x={xPositions[index] - 20} y={pointY(score) - 5}>{Math.round(score)}%</text>
          </Fragment>
        ))}
        {trackScores.map((score, index) => (
          <Fragment key={`track-${labels[index]}`}>
            <rect className="taste-chart-bar taste-chart-tracks" height={barHeight(score)} rx="2" style={{ animationDelay: `${300 + index * 90}ms` }} width="36" x={xPositions[index] + 2} y={pointY(score)} />
            <text className="taste-chart-value fill-zinc-600 text-[10px] font-semibold" textAnchor="middle" x={xPositions[index] + 20} y={pointY(score) - 5}>{Math.round(score)}%</text>
          </Fragment>
        ))}
        {labels.map((label, index) => <text className="fill-zinc-500 text-[11px] font-medium" key={label} textAnchor="middle" x={xPositions[index]} y="212">{label}</text>)}
      </svg>
    </div>
  );
}
