import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "kemex_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type Session = {
  userId: string;
  email: string;
  expiresAt: number;
};

function sessionSecret() {
  // SESSION_SECRET remains an optional independent key. If it is missing or too short,
  // derive a stable, server-only signing key from the Neon connection string.
  // Unlike randomBytes() at runtime, this value is identical across serverless instances.
  const configuredSecret = process.env.SESSION_SECRET;
  if (configuredSecret && Buffer.byteLength(configuredSecret) >= 32) {
    return configuredSecret;
  }

  const databaseSecret = process.env.DATABASE_URL;
  if (!databaseSecret || databaseSecret.length < 32) {
    throw new Error("Set DATABASE_URL or configure SESSION_SECRET with at least 32 bytes");
  }

  return createHmac("sha256", databaseSecret)
    .update("KEMEX-HUB/session-signing-key/v1")
    .digest();
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSession(userId: string, email: string) {
  const session: Session = {
    userId,
    email,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return { token: `${payload}.${signature(payload)}`, maxAge: SESSION_DURATION_SECONDS };
}

export function readSession(req: Request): Session | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return null;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const payload = token.slice(0, separator);
  const suppliedSignature = Buffer.from(token.slice(separator + 1));
  const expectedSignature = Buffer.from(signature(payload));
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (
      typeof session.userId !== "string" ||
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
