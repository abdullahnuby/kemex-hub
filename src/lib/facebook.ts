const GRAPH = "https://graph.facebook.com/v21.0";
const GRAPH_VIDEO = "https://graph-video.facebook.com/v21.0";
const RUPLOAD = "https://rupload.facebook.com/video-upload/v21.0";

export type Kind = "photo" | "video" | "reel";

function form(fields: Record<string, string>) {
  return new URLSearchParams(fields);
}

async function fbFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || data?.raw || `HTTP ${res.status}`;
    throw new Error(`Facebook: ${msg}`);
  }
  return data;
}

export async function publishToFacebook(opts: {
  kind: Kind;
  mediaUrl: string;
  caption: string;
}): Promise<{ id: string; link: string }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) {
    throw new Error("FB_PAGE_ID / FB_PAGE_TOKEN مش متظبطين");
  }
  const { kind, mediaUrl, caption } = opts;

  // صورة
  if (kind === "photo") {
    const d = await fbFetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      body: form({ url: mediaUrl, caption, access_token: token }),
    });
    const id = String(d.post_id || d.id);
    return { id, link: `https://www.facebook.com/${id}` };
  }

  // فيديو عادي: فيسبوك بيسحب الملف من الرابط بنفسه
  if (kind === "video") {
    const d = await fbFetch(`${GRAPH_VIDEO}/${pageId}/videos`, {
      method: "POST",
      body: form({ file_url: mediaUrl, description: caption, access_token: token }),
    });
    const id = String(d.id);
    return { id, link: `https://www.facebook.com/watch/?v=${id}` };
  }

  // ريل: 3 مراحل (start → upload بالرابط → finish)
  const start = await fbFetch(`${GRAPH}/${pageId}/video_reels`, {
    method: "POST",
    body: form({ upload_phase: "start", access_token: token }),
  });
  const videoId = String(start.video_id);
  const uploadUrl: string = start.upload_url || `${RUPLOAD}/${videoId}`;

  await fbFetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, file_url: mediaUrl },
  });

  await fbFetch(`${GRAPH}/${pageId}/video_reels`, {
    method: "POST",
    body: form({
      upload_phase: "finish",
      video_id: videoId,
      video_state: "PUBLISHED",
      description: caption,
      access_token: token,
    }),
  });

  return { id: videoId, link: `https://www.facebook.com/reel/${videoId}` };
}
