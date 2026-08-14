import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerEnv } from "./env";

const validEnvironment = {
  AUTH_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/intune",
  SPOTIFY_CLIENT_ID: "spotify-client-id",
  SPOTIFY_CLIENT_SECRET: "spotify-client-secret",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server environment", () => {
  it("accepts a complete configuration", () => {
    for (const [name, value] of Object.entries(validEnvironment)) {
      vi.stubEnv(name, value);
    }

    expect(getServerEnv()).toMatchObject(validEnvironment);
  });

  it("reports missing configuration without exposing secret values", () => {
    vi.stubEnv("AUTH_SECRET", "short");
    vi.stubEnv("DATABASE_URL", "not-a-url");
    vi.stubEnv("SPOTIFY_CLIENT_ID", "");
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "super-secret-value");

    let message = "";

    try {
      getServerEnv();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toMatch(/AUTH_SECRET, DATABASE_URL, SPOTIFY_CLIENT_ID/);
    expect(message).not.toContain("super-secret-value");
  });
});
