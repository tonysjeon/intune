import { z } from "zod";

import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/token-crypto";

export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
] as const;

const refreshResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().optional(),
});

export class SpotifyReauthorizationError extends Error {
  constructor() {
    super("Spotify authorization has expired and must be renewed");
    this.name = "SpotifyReauthorizationError";
  }
}

export async function getSpotifyAccessToken(userId: string): Promise<string> {
  const account = await db.account.findFirst({
    where: { userId, provider: "spotify" },
  });

  if (!account?.access_token) {
    throw new SpotifyReauthorizationError();
  }

  const { AUTH_SECRET } = getServerEnv();
  const expiresSoon =
    !account.expires_at || account.expires_at <= Math.floor(Date.now() / 1000) + 60;

  if (!expiresSoon) {
    return decryptToken(account.access_token, AUTH_SECRET);
  }

  if (!account.refresh_token) {
    throw new SpotifyReauthorizationError();
  }

  return refreshSpotifyAccessToken(account.id, account.refresh_token);
}

export async function refreshSpotifyAccessToken(
  accountId: string,
  encryptedRefreshToken: string,
): Promise<string> {
  const env = getServerEnv();
  const refreshToken = decryptToken(encryptedRefreshToken, env.AUTH_SECRET);
  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const invalidGrant =
      response.status === 400 &&
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error === "invalid_grant";

    if (invalidGrant) {
      await db.account.update({
        where: { id: accountId },
        data: { access_token: null, expires_at: null, refresh_token: null },
      });
      throw new SpotifyReauthorizationError();
    }

    throw new Error(`Spotify token refresh failed with status ${response.status}`);
  }

  const tokens = refreshResponseSchema.parse(await response.json());
  const encryptedAccessToken = encryptToken(tokens.access_token, env.AUTH_SECRET);

  await db.account.update({
    where: { id: accountId },
    data: {
      access_token: encryptedAccessToken,
      expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
      ...(tokens.refresh_token
        ? { refresh_token: encryptToken(tokens.refresh_token, env.AUTH_SECRET) }
        : {}),
    },
  });

  return tokens.access_token;
}
