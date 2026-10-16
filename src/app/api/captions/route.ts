import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const body = await req.json();
    const videoId = typeof body.video_id === "string" ? body.video_id : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!videoId || !text) {
      return NextResponse.json({ error: "بيانات الكابشن غير صالحة" }, { status: 400 });
    }
    const rows = await database()`
      INSERT INTO captions (video_id, text) VALUES (${videoId}, ${text}) RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
