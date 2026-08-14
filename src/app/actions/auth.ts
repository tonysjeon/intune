"use server";

import { revalidatePath } from "next/cache";

import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";
import { syncSpotifyListeningData } from "@/lib/listening-sync";
import { SPOTIFY_SCOPES, SpotifyReauthorizationError } from "@/lib/spotify";
import { SpotifyApiError } from "@/lib/spotify-api";

export interface ListeningSyncState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function connectSpotify() {
  await signIn(
    "spotify",
    { redirectTo: "/dashboard" },
    { scope: SPOTIFY_SCOPES.join(" "), show_dialog: "true" },
  );
}

export async function disconnectSpotify() {
  const session = await auth();

  if (!session?.user.id) {
    throw new Error("You must be signed in to disconnect Spotify");
  }

  await db.account.deleteMany({
    where: { userId: session.user.id, provider: "spotify" },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function syncListeningData(
  _previousState: ListeningSyncState,
): Promise<ListeningSyncState> {
  void _previousState;
  const session = await auth();

  if (!session?.user.id) {
    return { status: "error", message: "Sign in before syncing Spotify" };
  }

  try {
    await syncSpotifyListeningData(session.user.id);
    revalidatePath("/dashboard");
    return { status: "success", message: "Your listening data is up to date" };
  } catch (error) {
    if (error instanceof SpotifyReauthorizationError) {
      return { status: "error", message: "Reconnect Spotify and try again" };
    }

    if (error instanceof SpotifyApiError && error.status === 429) {
      const wait = error.retryAfter ? ` Try again in ${error.retryAfter} seconds.` : "";
      return { status: "error", message: `Spotify is rate limiting requests.${wait}` };
    }

    return { status: "error", message: "Spotify sync failed Please try again" };
  }
}
