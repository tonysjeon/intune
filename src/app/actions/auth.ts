"use server";

import { revalidatePath } from "next/cache";

import { auth, signIn } from "@/auth";
import { db } from "@/lib/db";

export async function connectSpotify() {
  await signIn("spotify", { redirectTo: "/dashboard" });
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
}
