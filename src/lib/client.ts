import { sb } from "./supabase-browser";

export type PublishStatus = "success" | "paused" | "skipped_recent" | "no_video" | "error";

export const STATUS_TEXT: Record<string, string> = {
  success: "اتنشر ✅",
  paused: "النشر الأوتوماتيك موقوف",
  skipped_recent: "اتخطى: في نشر حصل من ساعات قليلة",
  no_video: "مفيش فيديو متاح للنشر (كله اتنشر مؤخرًا أو مفيش كابشنات)",
  error: "حصل خطأ",
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await sb().auth.getSession();
  if (!data.session) throw new Error("غير مصرح");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error ?? `HTTP ${res.status}`);
  return payload as T;
}

export async function callPublish(body: Record<string, unknown>) {
  const { data } = await sb().auth.getSession();
  const res = await fetch("/api/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ status: "error", error: `HTTP ${res.status}` }))) as {
    status: PublishStatus;
    title?: string;
    link?: string;
    error?: string;
  };
}

export function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
