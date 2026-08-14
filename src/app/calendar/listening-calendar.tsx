"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCalendarDates, localDateKey } from "@/lib/listening-calendar";

const sessionGapMs = 60 * 60 * 1000;

interface CalendarPlay {
  trackId: string;
  playedAt: string;
  name: string;
  albumName: string;
  albumImageUrl: string | null;
  artistNames: string[];
}

export function ListeningCalendar({ plays }: { plays: CalendarPlay[] }) {
  const initialDate = plays[0] ? new Date(plays[0].playedAt) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(() => localDateKey(initialDate));
  const songListRef = useRef<HTMLOListElement>(null);
  const [scrollFades, setScrollFades] = useState({ top: false, bottom: false });
  const playsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarPlay[]>();
    for (const play of plays) {
      const key = localDateKey(new Date(play.playedAt));
      grouped.set(key, [...(grouped.get(key) ?? []), play]);
    }
    return grouped;
  }, [plays]);
  const dates = getCalendarDates(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
  );
  const selectedPlays = useMemo(
    () => playsByDay.get(selectedDay) ?? [],
    [playsByDay, selectedDay],
  );
  const selectedPlayGroups = useMemo(() => {
    const sortedPlays = [...selectedPlays].sort((a, b) =>
      a.playedAt.localeCompare(b.playedAt),
    );

    return sortedPlays.reduce<CalendarPlay[][]>((groups, play) => {
      const currentGroup = groups[groups.length - 1];
      const previousPlay = currentGroup?.[currentGroup.length - 1];
      const startsNewSession =
        !previousPlay ||
        new Date(play.playedAt).getTime() - new Date(previousPlay.playedAt).getTime() >
          sessionGapMs;

      if (startsNewSession) {
        groups.push([play]);
      } else {
        currentGroup.push(play);
      }

      return groups;
    }, []);
  }, [selectedPlays]);
  const todayKey = localDateKey(new Date());
  const currentMonth = new Date();
  const isCurrentMonth =
    visibleMonth.getFullYear() === currentMonth.getFullYear() &&
    visibleMonth.getMonth() === currentMonth.getMonth();

  const updateScrollFades = useCallback(() => {
    const songList = songListRef.current;
    if (!songList) return;

    const top = songList.scrollTop > 4;
    const bottom = songList.scrollTop + songList.clientHeight < songList.scrollHeight - 4;

    setScrollFades((current) =>
      current.top === top && current.bottom === bottom ? current : { top, bottom },
    );
  }, []);

  useEffect(() => {
    const songList = songListRef.current;
    if (!songList) return;

    songList.scrollTop = 0;
    updateScrollFades();

    const resizeObserver = new ResizeObserver(updateScrollFades);
    resizeObserver.observe(songList);
    return () => resizeObserver.disconnect();
  }, [selectedDay, selectedPlayGroups.length, updateScrollFades]);

  function moveMonth(offset: number) {
    if (offset > 0 && isCurrentMonth) return;

    const next = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    setVisibleMonth(next);
    setSelectedDay(localDateKey(next));
  }

  return (
    <section className="mx-auto max-w-7xl py-8 lg:py-10">
      <div className="grid justify-center gap-8 xl:grid-cols-[minmax(0,820px)_360px] xl:items-stretch">
        <div className="h-full w-full rounded-[2rem] border border-white/10 bg-white p-3 shadow-lg shadow-black/5 sm:p-5 xl:h-[790px]">
          <div className="flex items-center justify-between px-1 pb-5 sm:px-2">
            <button aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white/55 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white" onClick={() => moveMonth(-1)} type="button">←</button>
            <h2 className="text-lg font-medium tracking-tight sm:text-2xl">
              {visibleMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
            </h2>
            <button aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg text-white/55 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:bg-transparent" disabled={isCurrentMonth} onClick={() => moveMonth(1)} type="button">→</button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white/30 sm:text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="pb-3" key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {dates.map((date) => {
              const key = localDateKey(date);
              const dayPlays = playsByDay.get(key) ?? [];
              const images = [...new Set(dayPlays.map(({ albumImageUrl }) => albumImageUrl).filter((image): image is string => Boolean(image)))].slice(0, 3);
              const inMonth = date.getMonth() === visibleMonth.getMonth();
              return (
                <button
                  aria-label={`${date.toLocaleDateString([], { month: "long", day: "numeric" })}, ${dayPlays.length} stored plays`}
                  className={`group relative aspect-square overflow-hidden rounded-xl border text-left sm:rounded-2xl ${selectedDay === key ? "border-black bg-zinc-100 shadow-md shadow-black/10" : key === todayKey ? "border-zinc-500 bg-white" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"} ${inMonth ? "text-black" : "text-black/20"}`}
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  type="button"
                >
                  <span className={`absolute left-1.5 top-1.5 z-20 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-medium sm:left-2.5 sm:top-2.5 sm:h-7 sm:min-w-7 sm:text-xs ${selectedDay === key ? "bg-black text-[#fff]" : "text-current"}`}>
                    {date.getDate()}
                  </span>
                  {key === todayKey ? (
                    <span className="absolute right-1.5 top-1.5 z-20 text-[7px] font-medium uppercase tracking-[0.08em] text-zinc-500 sm:right-2.5 sm:top-2.5 sm:text-[8px]">
                      <span className="hidden sm:inline">Today</span>
                      <span className="sm:hidden">•</span>
                    </span>
                  ) : null}
                  {images.length ? (
                    <span className="absolute bottom-1.5 left-1.5 flex h-8 w-14 sm:bottom-2.5 sm:left-2.5 sm:h-11 sm:w-20">
                      {images.map((image, index) => (
                        <Image alt="" className="absolute h-8 w-8 rounded border-2 border-white object-cover shadow-lg sm:h-11 sm:w-11" height={44} key={image} src={image} style={{ left: index * 12, zIndex: images.length - index }} width={44} />
                      ))}
                    </span>
                  ) : null}
                  {dayPlays.length ? <span className="absolute bottom-1.5 right-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[8px] text-zinc-600 sm:bottom-2.5 sm:right-2.5 sm:text-[9px]">{dayPlays.length}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="flex h-full min-h-0 w-full flex-col rounded-[2rem] border border-white/10 bg-white p-6 shadow-lg shadow-black/5 xl:h-[790px]">
          <div className="flex min-h-0 flex-1 flex-col" key={selectedDay}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[22px] font-semibold leading-none tracking-tight">
                {new Date(`${selectedDay}T12:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
              </h2>
              <p className="shrink-0 text-[13px] leading-none text-white/40">{selectedPlays.length} plays</p>
            </div>

            {selectedPlays.length ? (
              <div className="relative mt-4 min-h-0 flex-1">
                <ol className="minimal-scrollbar h-full space-y-2 overflow-y-auto pr-1" onScroll={updateScrollFades} ref={songListRef}>
                  {selectedPlayGroups.map((group, groupIndex) => (
                    <li key={`${group[0].playedAt}:${group[0].trackId}`}>
                      <ol className="space-y-1">
                        {group.map((play, playIndex) => {
                          const waterfallIndex = selectedPlayGroups
                            .slice(0, groupIndex)
                            .reduce((count, previousGroup) => count + previousGroup.length, 0) + playIndex;

                          return (
                          <li
                            className="sidebar-waterfall-enter relative grid grid-cols-[58px_minmax(0,1fr)] items-stretch gap-3 px-2"
                            key={`${play.playedAt}:${play.trackId}`}
                            style={{ animationDelay: `${50 + Math.min(waterfallIndex, 12) * 35}ms` }}
                          >
                            <div className="relative flex items-center justify-center">
                              <time className="relative z-10 whitespace-nowrap rounded-md bg-white px-1 py-1 text-[11px] font-medium tabular-nums text-white/40" dateTime={play.playedAt}>{new Date(play.playedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                              {playIndex < group.length - 1 ? <span aria-hidden="true" className="absolute -bottom-[34px] left-1/2 top-1/2 z-0 w-0.5 -translate-x-1/2 bg-zinc-300" /> : null}
                            </div>
                            <a
                              className="group grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded px-2 py-2 transition hover:bg-white/[0.04]"
                              href={`https://open.spotify.com/track/${play.trackId}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {play.albumImageUrl ? <Image alt="" className="h-11 w-11 rounded object-cover" height={44} src={play.albumImageUrl} width={44} /> : <span className="h-11 w-11 rounded bg-white/[0.05]" />}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{play.name}</p>
                                <div className="relative h-4">
                                  <p className="truncate text-xs text-white/35 transition-opacity group-hover:opacity-0">{play.artistNames.join(", ")}</p>
                                  <p className="absolute inset-0 truncate text-xs font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">Open in Spotify ↗</p>
                                </div>
                              </div>
                            </a>
                          </li>
                          );
                        })}
                      </ol>
                      {groupIndex < selectedPlayGroups.length - 1 ? <div aria-hidden="true" className="mx-2 mt-2 border-t border-zinc-200" /> : null}
                    </li>
                  ))}
                </ol>
                <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white to-transparent transition-opacity ${scrollFades.top ? "opacity-100" : "opacity-0"}`} />
                <span aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-white to-transparent transition-opacity ${scrollFades.bottom ? "opacity-100" : "opacity-0"}`} />
              </div>
            ) : <p className="sidebar-waterfall-enter mt-8 text-sm leading-6 text-white/35" style={{ animationDelay: "50ms" }}>No plays have been collected for this day yet.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}
