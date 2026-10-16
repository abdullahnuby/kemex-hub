import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { registrationDatabase } from "@/lib/registration";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = readSession(req);
  if (!session) {
    return NextResponse.json({ error: "سجّل الدخول أولًا لإنشاء رمز دعوة." }, { status: 401 });
  }

  try {
    const sql = await registrationDatabase();
    const code = randomBytes(24).toString("base64url");
    const digest = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO kemex_hub_registration_invites (token_hash, created_by, expires_at)
      VALUES (${digest}, ${session.userId}, ${expiresAt})
    `;

    // Return the raw code once. Only its hash is persisted in Neon.
    return NextResponse.json({ code, expiresAt }, { status: 201 });
  } catch (error) {
    console.error("Invite creation failed:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "تعذر إنشاء رمز الدعوة الآن. حاول مرة أخرى." }, { status: 500 });
  }
}
