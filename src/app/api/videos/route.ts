import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const videos = await database()`
      SELECT
        v.*,
        COALESCE(
          json_agg(json_build_object('id', c.id, 'text', c.text, 'times_used', c.times_used))
            FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS captions
      FROM videos v
      LEFT JOIN captions c ON c.video_id = v.id
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `;
    return NextResponse.json(videos);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const mediaUrl = typeof body.media_url === "string" ? body.media_url.trim() : "";
    const kind = body.kind;
    const captions = Array.isArray(body.captions)
      ? body.captions.filter((text: unknown): text is string => typeof text === "string" && !!text.trim())
        .map((text: string) => text.trim())
      : [];

    if (!title || !mediaUrl || !["photo", "video", "reel"].includes(kind)) {
      return NextResponse.json({ error: "بيانات المحتوى غير صالحة" }, { status: 400 });
    }

    const rows = await database()`
      WITH new_video AS (
        INSERT INTO videos (title, product, media_url, storage_path, kind)
        VALUES (
          ${title},
          ${typeof body.product === "string" && body.product.trim() ? body.product.trim() : null},
          ${mediaUrl},
          ${typeof body.storage_path === "string" ? body.storage_path : null},
          ${kind}
        )
        RETURNING id
      ), new_captions AS (
        INSERT INTO captions (video_id, text)
        SELECT new_video.id, item.caption_text
        FROM new_video
        CROSS JOIN jsonb_array_elements_text(${JSON.stringify(captions)}::jsonb) AS item(caption_text)
        RETURNING id
      )
      SELECT id FROM new_video
    `;
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
