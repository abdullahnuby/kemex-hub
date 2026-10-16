import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const rows = await database()`
      SELECT
        p.id, p.status, p.kind, p.fb_link, p.error, p.created_at,
        v.title AS video_title, c.text AS caption_text
      FROM posts p
      LEFT JOIN videos v ON v.id = p.video_id
      LEFT JOIN captions c ON c.id = p.caption_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}
