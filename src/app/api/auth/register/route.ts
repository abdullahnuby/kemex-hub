import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { database } from "@/lib/neon";
import { createSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

function matchesInviteCode(supplied: string, expected: string) {
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "بيانات التسجيل غير صالحة." }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "بيانات التسجيل غير صالحة." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const inviteCode = typeof data.inviteCode === "string" ? data.inviteCode.trim() : "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email) || email.length > 254) {
      return NextResponse.json({ error: "اكتب بريدًا إلكترونيًا صحيحًا." }, { status: 400 });
    }
    if (password.length < 12 || password.length > 1024) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 12 حرفًا على الأقل." }, { status: 400 });
    }
    if (data.confirmPassword !== password) {
      return NextResponse.json({ error: "كلمتا المرور غير متطابقتين." }, { status: 400 });
    }

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || Buffer.byteLength(sessionSecret) < 32) {
      return NextResponse.json({ error: "إعدادات الجلسة غير مكتملة. تواصل مع مسؤول المنصة." }, { status: 503 });
    }

    const requiredInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!requiredInviteCode) {
      return NextResponse.json({ error: "التسجيل غير مفعّل بعد. اطلب من مسؤول المنصة إعداد رمز الدعوة." }, { status: 503 });
    }
    if (!inviteCode || !matchesInviteCode(inviteCode, requiredInviteCode)) {
      return NextResponse.json({ error: "رمز الدعوة غير صحيح." }, { status: 403 });
    }

    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    const passwordHash = `${salt.toString("base64url")}.${hash.toString("base64url")}`;
    const users = await database()`
      INSERT INTO user_accounts (email, password_hash)
      VALUES (${email}, ${passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `;

    const user = users[0] as { id: string; email: string } | undefined;
    if (!user) {
      return NextResponse.json({ error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." }, { status: 409 });
    }

    const session = createSession(user.id, user.email);
    const response = NextResponse.json({ authenticated: true, email: user.email }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "تعذر إنشاء الحساب حاليًا. راجع إعدادات Neon وحاول مرة أخرى." }, { status: 500 });
  }
}
