import { describe, expect, it } from "vitest";

import { decryptToken, encryptToken } from "./token-crypto";

const secret = "a-secure-test-secret-that-is-long-enough";

describe("OAuth token encryption", () => {
  it("round trips a token without storing its plaintext", () => {
    const token = "spotify-access-token";
    const encrypted = encryptToken(token, secret);

    expect(encrypted).not.toContain(token);
    expect(decryptToken(encrypted, secret)).toBe(token);
  });

  it("uses a unique initialization vector for every encryption", () => {
    const first = encryptToken("same-token", secret);
    const second = encryptToken("same-token", secret);

    expect(first).not.toBe(second);
  });

  it("rejects tokens decrypted with a different secret", () => {
    const encrypted = encryptToken("spotify-token", secret);

    expect(() => decryptToken(encrypted, "a-different-secret")).toThrow();
  });
});
