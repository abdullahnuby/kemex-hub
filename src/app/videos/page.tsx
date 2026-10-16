"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiRequest, callPublish, fmt, STATUS_TEXT } from "@/lib/client";

type Caption = { id: string; text: string; times_used: number };
type Kind = "photo" | "video" | "reel";
type Video = {
  id: string;
  title: string;
  product: string | null;
  media_url: string;
  kind: Kind;
  active: boolean;
  times_posted: number;
  last_posted_at: string | null;
  captions: Caption[];
};

const KIND_TEXT: Record<Kind, string> = { reel: "ريل", video: "فيديو", photo: "صورة" };

export default function VideosPage() {
  return (
    <AuthGate>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      setVideos(await apiRequest<Video[]>("/api/videos"));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {loadError && <div className="msg" style={{ color: "var(--danger)" }}>{loadError}</div>}
      <AddForm onDone={load} />
      {loading && <p className="muted center">جاري التحميل...</p>}
      {videos.map((v) => (
        <VideoCard key={v.id} v={v} onChange={load} />
      ))}
      {!loading && videos.length === 0 && <p className="muted center">لسه مفيش محتوى. ضيف أول فيديو من فوق.</p>}
    </>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [product, setProduct] = useState("");
  const [kind, setKind] = useState<Kind>("reel");
  const [url, setUrl] = useState("");
  const [captions, setCaptions] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const mediaUrl = url.trim();
      if (!mediaUrl) throw new Error("حط رابطًا مباشرًا عامًا للملف");
      const parsedUrl = new URL(mediaUrl);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        throw new Error("الرابط لازم يبدأ بـ https:// أو http://");
      }

      const caps = captions.map((c) => c.trim()).filter(Boolean);
      await apiRequest("/api/videos", {
        method: "POST",
        body: JSON.stringify({
          title,
          product,
          kind,
          media_url: mediaUrl,
          captions: caps,
        }),
      });

      setTitle(""); setProduct(""); setUrl(""); setCaptions(["", "", ""]); setOpen(false);
      onDone();
    } catch (ex: any) {
      setErr(ex?.message ?? String(ex));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 14 }}>
        <button className="btn" onClick={() => setOpen(true)}>+ إضافة محتوى جديد</button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>محتوى جديد</h2>
      <label>اسم داخلي (للتمييز بس)</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثلاً: شرابات أطفال قطن" />
      <label>المنتج (اختياري)</label>
      <input value={product} onChange={(e) => setProduct(e.target.value)} />
      <label>النوع</label>
      <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
        <option value="reel">ريل (رأسي، حتى 90 ثانية)</option>
        <option value="video">فيديو عادي</option>
        <option value="photo">صورة</option>
      </select>
      <label>رابط مباشر عام للصورة أو الفيديو</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." dir="ltr" />
      <p className="muted">ارفع الملف على استضافة خارجية، ثم ضع رابطًا مباشرًا عامًا يمكن لفيسبوك الوصول إليه. رابط جوجل درايف العادي لا يعمل.</p>

      <label>الكابشنات (3 على الأقل، كل مرة بيتنشر بكابشن مختلف)</label>
      {captions.map((c, i) => (
        <textarea
          key={i}
          value={c}
          placeholder={`كابشن ${i + 1}`}
          onChange={(e) => setCaptions(captions.map((x, j) => (j === i ? e.target.value : x)))}
          style={{ marginBottom: 8 }}
        />
      ))}
      <button type="button" className="btn ghost small" onClick={() => setCaptions([...captions, ""])}>
        + كابشن تاني
      </button>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" disabled={busy}>{busy ? "بيحفظ..." : "حفظ"}</button>
        <button type="button" className="btn ghost" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
      {err && <div className="msg" style={{ color: "var(--danger)" }}>{err}</div>}
    </form>
  );
}

function VideoCard({ v, onChange }: { v: Video; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [newCap, setNewCap] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    await apiRequest(`/api/videos/${v.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !v.active }),
    });
    onChange();
  }

  async function remove() {
    if (!confirm("متأكد إنك عايز تمسح ده نهائيًا؟")) return;
    await apiRequest(`/api/videos/${v.id}`, { method: "DELETE" });
    onChange();
  }

  async function publishNow() {
    if (!confirm("تنشر ده على الصفحة دلوقتي؟")) return;
    setBusy(true);
    setMsg("");
    const r = await callPublish({ force: true, videoId: v.id });
    setMsg(
      r.status === "success"
        ? `اتنشر ✅ ${r.link ?? ""}`
        : r.error ?? STATUS_TEXT[r.status] ?? r.status
    );
    setBusy(false);
    onChange();
  }

  async function addCap() {
    const t = newCap.trim();
    if (!t) return;
    await apiRequest("/api/captions", {
      method: "POST",
      body: JSON.stringify({ video_id: v.id, text: t }),
    });
    setNewCap("");
    onChange();
  }

  return (
    <div className="card" style={{ opacity: v.active ? 1 : 0.65 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>{v.title}</b>
        <span className="row">
          <span className="badge">{KIND_TEXT[v.kind]}</span>
          {v.captions.length < 3 && <span className="badge warn">كابشنات قليلة ({v.captions.length})</span>}
          {!v.active && <span className="badge err">موقوف</span>}
        </span>
      </div>
      {v.product && <div className="muted">{v.product}</div>}
      {v.kind === "photo" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="media" src={v.media_url} alt={v.title} />
      ) : (
        <video className="media" src={v.media_url} controls preload="metadata" />
      )}
      <div className="muted">
        اتنشر {v.times_posted} مرة · آخر نشر: {fmt(v.last_posted_at)}
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn small" onClick={publishNow} disabled={busy}>
          {busy ? "بينشر..." : "انشر دلوقتي"}
        </button>
        <button className="btn ghost small" onClick={toggle}>{v.active ? "إيقاف" : "تفعيل"}</button>
        <button className="btn ghost small" onClick={() => setOpen(!open)}>
          {open ? "إخفاء الكابشنات" : `الكابشنات (${v.captions.length})`}
        </button>
        <button className="btn danger small" onClick={remove}>مسح</button>
      </div>
      {msg && <div className="msg">{msg}</div>}

      {open && (
        <div>
          {v.captions.map((c) => (
            <CaptionRow key={c.id} c={c} onChange={onChange} />
          ))}
          <div className="cap">
            <textarea value={newCap} onChange={(e) => setNewCap(e.target.value)} placeholder="كابشن جديد" />
            <button className="btn small" style={{ marginTop: 8 }} onClick={addCap}>إضافة</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaptionRow({ c, onChange }: { c: Caption; onChange: () => void }) {
  const [text, setText] = useState(c.text);
  return (
    <div className="cap">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row" style={{ marginTop: 6 }}>
        <small>اتستخدم {c.times_used} مرة</small>
        {text !== c.text && (
          <button
            className="btn small"
            onClick={async () => {
              await apiRequest(`/api/captions/${c.id}`, {
                method: "PATCH",
                body: JSON.stringify({ text }),
              });
              onChange();
            }}
          >
            حفظ التعديل
          </button>
        )}
        <button
          className="btn danger small"
          onClick={async () => {
            await apiRequest(`/api/captions/${c.id}`, { method: "DELETE" });
            onChange();
          }}
        >
          مسح
        </button>
      </div>
    </div>
  );
}
