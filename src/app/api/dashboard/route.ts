import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const sql = database();
    const settings = await sql`SELECT paused, min_gap_days, min_hours_between FROM settings WHERE id = 1`;
    const gapDays = settings[0]?.min_gap_days ?? 7;
    const [counts, recentPosts, weekPosts] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE active)::int AS active,
          COUNT(*) FILTER (
            WHERE active
              AND (last_posted_at IS NULL OR last_posted_at <= NOW() - make_interval(days => ${gapDays}))
              AND EXISTS (SELECT 1 FROM captions c WHERE c.video_id = videos.id)
          )::int AS eligible
        FROM videos
      `,
      sql`
        SELECT p.id, p.status, p.fb_link, p.error, p.created_at, v.title AS video_title
        FROM posts p
        LEFT JOIN videos v ON v.id = p.video_id
        ORDER BY p.created_at DESC
        LIMIT 6
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM posts
        WHERE status = 'success' AND created_at >= NOW() - INTERVAL '7 days'
      `,
    ]);

    const setting = settings[0] ?? { paused: false, min_gap_days: 7, min_hours_between: 3 };
    const count = counts[0] ?? { total: 0, active: 0, eligible: 0 };

    return NextResponse.json({
      settings: setting,
      stats: {
        total: count.total,
        active: count.active,
        eligible: count.eligible,
        week: weekPosts[0]?.count ?? 0,
      },
      posts: recentPosts,
    });
  } catch (error) {
    return apiError(error);
  }
}
