import { database } from "./neon";
import { publishToFacebook, Kind } from "./facebook";
import { notify } from "./telegram";

export type PublishResult = {
  status: "success" | "paused" | "skipped_recent" | "no_video" | "error";
  title?: string;
  link?: string;
  error?: string;
};

type CaptionRow = {
  id: string;
  text: string;
  times_used: number;
  last_used_at: string | null;
};

type VideoRow = {
  id: string;
  title: string;
  media_url: string;
  kind: string;
  times_posted: number;
  captions: CaptionRow[];
};

function isCaptionRow(value: unknown): value is CaptionRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.text === "string" &&
    typeof row.times_used === "number" &&
    (typeof row.last_used_at === "string" || row.last_used_at === null)
  );
}

function parseVideoRow(row: Record<string, unknown>): VideoRow {
  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.media_url !== "string" ||
    typeof row.kind !== "string" ||
    typeof row.times_posted !== "number" ||
    !Array.isArray(row.captions) ||
    !row.captions.every(isCaptionRow)
  ) {
    throw new Error("بيانات الفيديو من قاعدة البيانات غير صالحة");
  }
  return {
    id: row.id,
    title: row.title,
    media_url: row.media_url,
    kind: row.kind,
    times_posted: row.times_posted,
    captions: row.captions,
  };
}

function pickCaption(captions: CaptionRow[]): CaptionRow {
  return [...captions].sort((a, b) => {
    if (a.times_used !== b.times_used) return a.times_used - b.times_used;
    const ta = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const tb = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
    return ta - tb;
  })[0];
}

export async function runPublish(opts: {
  force?: boolean;
  videoId?: string;
}): Promise<PublishResult> {
  const sql = database();
  const settingRows = await sql`SELECT paused, min_gap_days, min_hours_between FROM settings WHERE id = 1`;
  const settings = settingRows[0];
  const minGapDays = settings?.min_gap_days ?? 7;
  const minHours = settings?.min_hours_between ?? 3;

  if (settings?.paused && !opts.force) return { status: "paused" };

  if (!opts.force) {
    const recent = await sql`
      SELECT id FROM posts
      WHERE status = 'success' AND created_at >= NOW() - make_interval(hours => ${minHours})
      LIMIT 1
    `;
    if (recent.length) return { status: "skipped_recent" };
  }

  const rows = opts.videoId
    ? await sql`
        SELECT v.id, v.title, v.media_url, v.kind, v.times_posted,
          COALESCE(
            json_agg(json_build_object(
              'id', c.id, 'text', c.text, 'times_used', c.times_used, 'last_used_at', c.last_used_at
            )) FILTER (WHERE c.id IS NOT NULL),
            '[]'::json
          ) AS captions
        FROM videos v
        LEFT JOIN captions c ON c.video_id = v.id
        WHERE v.id = ${opts.videoId}
        GROUP BY v.id
        ORDER BY v.times_posted ASC, v.last_posted_at ASC NULLS FIRST
      `
    : await sql`
        SELECT v.id, v.title, v.media_url, v.kind, v.times_posted,
          COALESCE(
            json_agg(json_build_object(
              'id', c.id, 'text', c.text, 'times_used', c.times_used, 'last_used_at', c.last_used_at
            )) FILTER (WHERE c.id IS NOT NULL),
            '[]'::json
          ) AS captions
        FROM videos v
        LEFT JOIN captions c ON c.video_id = v.id
        WHERE v.active = true
          AND (v.last_posted_at IS NULL OR v.last_posted_at <= NOW() - make_interval(days => ${minGapDays}))
        GROUP BY v.id
        ORDER BY v.times_posted ASC, v.last_posted_at ASC NULLS FIRST
      `;
  const videos = rows.map(parseVideoRow);

  const candidates = videos.filter((video) => video.captions.length > 0);
  if (!candidates.length) {
    if (opts.videoId) {
      return { status: "error", error: "الفيديو ده مفيش له كابشنات (أو مش موجود)" };
    }
    await notify(
      "⚠️ مفيش فيديو متاح للنشر دلوقتي (كله اتنشر في آخر أيام، أو مفيش كابشنات). ضيف محتوى جديد من الموقع."
    );
    return { status: "no_video" };
  }

  const video = candidates[0];
  const caption = pickCaption(video.captions);
  const kind = video.kind as Kind;

  try {
    const { id, link } = await publishToFacebook({
      kind,
      mediaUrl: video.media_url,
      caption: caption.text,
    });
    const now = new Date().toISOString();

    await sql`
      INSERT INTO posts (video_id, caption_id, kind, fb_post_id, fb_link, status)
      VALUES (${video.id}, ${caption.id}, ${kind}, ${id}, ${link}, 'success')
    `;
    await sql`
      UPDATE videos SET times_posted = times_posted + 1, last_posted_at = ${now}
      WHERE id = ${video.id}
    `;
    await sql`
      UPDATE captions SET times_used = times_used + 1, last_used_at = ${now}
      WHERE id = ${caption.id}
    `;

    await notify(`✅ اتنشر على صفحة طيبة: ${video.title}\n${link}\nشاركه في الجروبات المناسبة.`);
    return { status: "success", title: video.title, link };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      INSERT INTO posts (video_id, caption_id, kind, status, error)
      VALUES (${video.id}, ${caption.id}, ${kind}, 'error', ${message})
    `;
    await notify(`❌ فشل النشر: ${video.title}\n${message}`);
    return { status: "error", title: video.title, error: message };
  }
}
