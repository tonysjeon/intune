import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppHeader } from "@/app/app-header";
import { ListeningCalendar } from "@/app/calendar/listening-calendar";
import { db } from "@/lib/db";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user.id) redirect("/");

  const plays = await db.recentPlay.findMany({
    where: { userId: session.user.id },
    orderBy: { playedAt: "desc" },
    take: 5000,
    include: {
      track: {
        include: {
          artists: { include: { artist: true }, orderBy: { position: "asc" } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen px-6 py-6 sm:px-10 lg:px-16">
      <AppHeader userId={session.user.id} userImage={session.user.image} userName={session.user.name} />
      <ListeningCalendar
        plays={plays.map(({ track, trackId, playedAt }) => ({
          trackId,
          playedAt: playedAt.toISOString(),
          name: track.name,
          albumName: track.albumName,
          albumImageUrl: track.albumImageUrl,
          artistNames: track.artists.map(({ artist }) => artist.name),
        }))}
      />
    </main>
  );
}
