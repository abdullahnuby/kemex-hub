import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { admin } from "@/lib/supabase-admin";
import { runPublish } from "@/lib/publisher";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// "cron" = الجدولة (بالسر)، "user" = أنت من الموقع (بجلسة تسجيل الدخول)
async function whoIsCalling(req: Request): Promise<"cron" | "user" | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const secret = process.env.CRON_SECRET;
  if (secret && safeEqual(token, secret)) return "cron";
  try {
    const { data } = await admin().auth.getUser(token);
    return data?.user ? "user" : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const who = await whoIsCalling(req);
  if (!who) {
    return NextResponse.json({ status: "error", error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const result = await runPublish({
      force: who === "user" ? !!body.force : false,
      videoId: who === "user" ? body.videoId : undefined,
    });
    return NextResponse.json(result, { status: result.status === "error" ? 500 : 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
