import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const body = await req.json();
    const sql = database();

    if (typeof body.paused === "boolean") {
      await sql`UPDATE settings SET paused = ${body.paused} WHERE id = 1`;
    } else if (Number.isInteger(body.min_gap_days) && body.min_gap_days >= 1) {
      await sql`UPDATE settings SET min_gap_days = ${body.min_gap_days} WHERE id = 1`;
    } else {
      return NextResponse.json({ error: "إعدادات غير صالحة" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
