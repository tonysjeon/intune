"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface SharedItem {
  id: string;
  imageUrl: string | null;
  name: string;
  subtitle: string;
}

export function SharedCarousel({
  title,
  items,
  kind,
}: {
  title: string;
  items: SharedItem[];
  kind: "artist" | "track";
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollFades, setScrollFades] = useState({ left: false, right: false });

  const updateScrollFades = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const left = list.scrollLeft > 4;
    const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 4;
    setScrollFades((current) => current.left === left && current.right === right
      ? current
      : { left, right });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    updateScrollFades();
    const resizeObserver = new ResizeObserver(updateScrollFades);
    resizeObserver.observe(list);
    return () => resizeObserver.disconnect();
  }, [items.length, updateScrollFades]);

  return (
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      {items.length ? (
        <div className="relative mt-4">
          <ul className="minimal-scrollbar flex gap-3 overflow-x-auto pb-3 pr-3" onScroll={updateScrollFades} ref={listRef}>
            {items.map((item) => (
              <li className="w-56 shrink-0" key={item.id}>
                <a
                  className="group flex items-stretch rounded bg-white/[0.035] transition hover:bg-white/[0.05]"
                  href={`https://open.spotify.com/${kind}/${item.id}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {item.imageUrl ? (
                    <Image alt="" className="h-16 w-16 shrink-0 rounded object-cover" height={64} src={item.imageUrl} width={64} />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-zinc-100 text-sm text-zinc-500">{item.name.slice(0, 1)}</span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <div className="relative h-4">
                      <p className="truncate text-[11px] text-white/35 transition-opacity group-hover:opacity-0">{item.subtitle}</p>
                      <p className="absolute inset-0 flex items-center gap-1 whitespace-nowrap text-[10px] font-medium text-emerald-800 opacity-0 transition-opacity group-hover:opacity-100">
                        <Image alt="" height={12} src="/spotify-icon.svg" width={13} />
                        Open in Spotify ↗
                      </p>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className={`pointer-events-none absolute bottom-3 left-0 top-0 w-8 bg-gradient-to-r from-[#f4f4f5] via-[#f4f4f5]/60 to-transparent backdrop-blur-[0.5px] transition-opacity ${scrollFades.left ? "opacity-100" : "opacity-0"}`} />
          <span aria-hidden="true" className={`pointer-events-none absolute bottom-3 right-0 top-0 w-8 bg-gradient-to-l from-[#f4f4f5] via-[#f4f4f5]/60 to-transparent backdrop-blur-[0.5px] transition-opacity ${scrollFades.right ? "opacity-100" : "opacity-0"}`} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/35">No exact matches in your six-month top list—the genre score can still reveal common ground.</p>
      )}
    </div>
  );
}
