import { createHash, randomBytes, scryptSync } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/session";
import { registrationDatabase } from "@/lib/registration";

export const dynamic = "force-dynamic";

function tokenHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}


function setSessionCookie(response: NextResponse, user: { id: string; email: string }) {
  const session = createSession(user.id, user.email);
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
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

    const sql = await registrationDatabase();
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    const passwordHash = `${salt.toString("base64url")}.${hash.toString("base64url")}`;

    if (inviteCode) {
      const digest = tokenHash(inviteCode);
      const users = await sql`
        WITH valid_invite AS MATERIALIZED (
          SELECT id
          FROM kemex_hub_registration_invites
          WHERE token_hash = ${digest}
            AND used_at IS NULL
            AND expires_at > now()
          FOR UPDATE
        ), new_user AS (
          INSERT INTO user_accounts (email, password_hash)
          SELECT ${email}, ${passwordHash} FROM valid_invite
          ON CONFLICT (email) DO NOTHING
          RETURNING id, email
        ), consumed_invite AS (
          UPDATE kemex_hub_registration_invites AS invitation
          SET used_at = now()
          WHERE invitation.id IN (SELECT id FROM valid_invite)
            AND EXISTS (SELECT 1 FROM new_user)
          RETURNING invitation.id
        )
        SELECT id, email FROM new_user
      `;

      const user = users[0] as { id: string; email: string } | undefined;
      if (user) {
        const response = NextResponse.json({ authenticated: true, email: user.email }, { status: 201 });
        return setSessionCookie(response, user);
      }

      const existing = await sql`SELECT id FROM user_accounts WHERE email = ${email} LIMIT 1`;
      if (existing.length) {
        return NextResponse.json({ error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." }, { status: 409 });
      }
      return NextResponse.json({ error: "رمز الدعوة غير صالح أو منتهي الصلاحية أو تم استخدامه سابقًا." }, { status: 403 });
    }

    // The first account on an empty database may bootstrap the workspace once.
    // The singleton UPDATE locks the row, so only one concurrent request can claim it.
    const firstUsers = await sql`
      WITH claimed AS (
        UPDATE kemex_hub_auth_state
        SET bootstrap_completed = true
        WHERE id = 1 AND bootstrap_completed = false
        RETURNING id
      ), new_user AS (
        INSERT INTO user_accounts (email, password_hash)
        SELECT ${email}, ${passwordHash} FROM claimed
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email
      )
      SELECT id, email FROM new_user
    `;

    const firstUser = firstUsers[0] as { id: string; email: string } | undefined;
    if (firstUser) {
      const response = NextResponse.json({ authenticated: true, email: firstUser.email }, { status: 201 });
      return setSessionCookie(response, firstUser);
    }

    const existing = await sql`SELECT id FROM user_accounts WHERE email = ${email} LIMIT 1`;
    if (existing.length) {
      return NextResponse.json({ error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "إنشاء الحسابات الجديدة يحتاج رمز دعوة. سجّل الدخول واطلب من أحد أعضاء الفريق إنشاء رمز من لوحة التحكم." },
      { status: 403 }
    );
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "تعذر إنشاء الحساب حاليًا. تأكد من إعداد DATABASE_URL وجداول Neon ثم حاول مرة أخرى." }, { status: 500 });
  }
}
