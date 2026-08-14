import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";

function getKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    FORMAT_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptToken(value: string, secret: string): string {
  const [version, encodedIv, encodedTag, encodedToken] = value.split(".");

  if (version !== FORMAT_VERSION || !encodedIv || !encodedTag || !encodedToken) {
    throw new Error("Unsupported encrypted token format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(secret),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encodedToken, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
