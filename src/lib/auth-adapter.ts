import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { db } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { encryptToken } from "@/lib/token-crypto";

export function encryptedPrismaAdapter(): Adapter {
  const adapter = PrismaAdapter(db);
  const linkAccount = adapter.linkAccount;

  if (!linkAccount) {
    throw new Error("The configured authentication adapter cannot link accounts");
  }

  return {
    ...adapter,
    linkAccount(account) {
      const { AUTH_SECRET } = getServerEnv();

      return linkAccount({
        ...account,
        access_token: account.access_token
          ? encryptToken(account.access_token, AUTH_SECRET)
          : account.access_token,
        refresh_token: account.refresh_token
          ? encryptToken(account.refresh_token, AUTH_SECRET)
          : account.refresh_token,
      });
    },
  };
}
