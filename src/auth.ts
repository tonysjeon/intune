import NextAuth from "next-auth";
import Spotify, { type SpotifyProfile } from "next-auth/providers/spotify";

import { encryptedPrismaAdapter } from "@/lib/auth-adapter";
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
    session: { strategy: "database" },
    providers: [
      Spotify<InTuneSpotifyProfile>({
        clientId: env.SPOTIFY_CLIENT_ID,
        clientSecret: env.SPOTIFY_CLIENT_SECRET,
        authorization: {
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
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
  };
});
