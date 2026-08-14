export interface BehavioralPlay {
  trackId: string;
  playedAt: Date;
}

export interface BehavioralInsights {
  playCount: number;
  uniqueTrackCount: number;
  repeatRate: number;
  sessionCount: number;
  peakHour: number | null;
  mostRepeatedTrackId: string | null;
  mostRepeatedTrackCount: number;
}

const SESSION_GAP_MS = 30 * 60 * 1000;

export function calculateBehavioralInsights(
  plays: BehavioralPlay[],
): BehavioralInsights {
  if (!plays.length) {
    return {
      playCount: 0,
      uniqueTrackCount: 0,
      repeatRate: 0,
      sessionCount: 0,
      peakHour: null,
      mostRepeatedTrackId: null,
      mostRepeatedTrackCount: 0,
    };
  }

  const ordered = [...plays].sort(
    (a, b) => a.playedAt.getTime() - b.playedAt.getTime(),
  );
  const trackCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();
  let sessionCount = 1;

  for (let index = 0; index < ordered.length; index += 1) {
    const play = ordered[index];
    trackCounts.set(play.trackId, (trackCounts.get(play.trackId) ?? 0) + 1);
    const hour = play.playedAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

    const previous = ordered[index - 1];
    if (previous && play.playedAt.getTime() - previous.playedAt.getTime() > SESSION_GAP_MS) {
      sessionCount += 1;
    }
  }

  const [mostRepeatedTrackId, mostRepeatedTrackCount] = [...trackCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0];
  const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

  return {
    playCount: plays.length,
    uniqueTrackCount: trackCounts.size,
    repeatRate: Math.round((1 - trackCounts.size / plays.length) * 100),
    sessionCount,
    peakHour,
    mostRepeatedTrackId,
    mostRepeatedTrackCount,
  };
}

export function formatHour(hour: number | null): string {
  if (hour === null) return "—";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${suffix}`;
}
