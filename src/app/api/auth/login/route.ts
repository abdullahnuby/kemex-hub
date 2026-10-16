import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { database } from "@/lib/neon";
import { createSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

function verifyPassword(password: string, encodedHash: string) {
  const [salt, expected] = encodedHash.split(".");
  if (!salt || !expected) return false;

  const expectedHash = Buffer.from(expected, "base64url");
  const actualHash = scryptSync(password, Buffer.from(salt, "base64url"), 64);
  return (
    expectedHash.length === actualHash.length &&
    timingSafeEqual(expectedHash, actualHash)
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "الإيميل أو الباسورد غلط" }, { status: 400 });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ error: "الإيميل أو الباسورد غلط" }, { status: 400 });
    }

    const users = await database()`
      SELECT id, email, password_hash
      FROM user_accounts
      WHERE email = ${email}
      LIMIT 1
    `;
    const user = users[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "الإيميل أو الباسورد غلط" }, { status: 401 });
    }

    const session = createSession(user.id, user.email);
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Login failed:", message);
    return NextResponse.json({ error: "تعذر تسجيل الدخول حاليًا" }, { status: 500 });
  }
}
