import NextAuth from "next-auth";
import Spotify, { type SpotifyProfile } from "next-auth/providers/spotify";

import {
  encryptedPrismaAdapter,
  updateEncryptedOAuthAccount,
} from "@/lib/auth-adapter";
import { getServerEnv } from "@/lib/env";
import { SPOTIFY_SCOPES } from "@/lib/spotify";

interface InTuneSpotifyProfile extends SpotifyProfile {
  account_id?: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = getServerEnv();

  return {
    adapter: encryptedPrismaAdapter(),
    secret: env.AUTH_SECRET,
    redirectProxyUrl: `${env.AUTH_URL}/api/auth`,
    session: { strategy: "database" },
    providers: [
      Spotify<InTuneSpotifyProfile>({
        clientId: env.SPOTIFY_CLIENT_ID,
        clientSecret: env.SPOTIFY_CLIENT_SECRET,
        authorization: {
          url: "https://accounts.spotify.com/authorize",
          params: { scope: SPOTIFY_SCOPES.join(" ") },
        },
        profile(profile) {
          return {
            id: profile.account_id ?? profile.id,
            name: profile.display_name,
            email: profile.email,
            image: profile.images?.[0]?.url,
          };
        },
      }),
    ],
    callbacks: {
      async signIn({ account }) {
        if (account?.type === "oauth") {
          await updateEncryptedOAuthAccount(account);
        }
        return true;
      },
      redirect({ url, baseUrl }) {
        const destination = new URL(url, baseUrl);
        const internalOrigin = new URL(baseUrl).origin;
        const appOrigin = new URL(env.AUTH_URL).origin;

        if (
          destination.origin !== internalOrigin &&
          destination.origin !== appOrigin
        ) {
          return env.AUTH_URL;
        }

        return new URL(
          `${destination.pathname}${destination.search}${destination.hash}`,
          env.AUTH_URL,
        ).toString();
      },
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
  };
});
