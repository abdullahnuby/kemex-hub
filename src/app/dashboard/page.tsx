"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiRequest, callPublish, fmt, STATUS_TEXT } from "@/lib/client";

type Settings = { paused: boolean; min_gap_days: number; min_hours_between: number };
type Post = {
  id: string;
  status: string;
  fb_link: string | null;
  error: string | null;
  created_at: string;
  video_title: string | null;
};

function titleOf(p: Post) {
  return p.video_title ?? "—";
}

export default function Dashboard() {
  return (
    <AuthGate>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, eligible: 0, week: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [gap, setGap] = useState("7");

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{
        settings: Settings;
        stats: typeof stats;
        posts: Post[];
      }>("/api/dashboard");
      setSettings(result.settings);
      setGap(String(result.settings.min_gap_days));
      setStats(result.stats);
      setPosts(result.posts);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function publishNow() {
    if (!confirm("تنشر الفيديو الجاي في الدور دلوقتي؟")) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await callPublish({ force: true });
      setMsg(
        r.status === "success"
          ? `اتنشر ✅ ${r.title ?? ""} ${r.link ?? ""}`
          : r.error ?? STATUS_TEXT[r.status] ?? r.status
      );
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function togglePause() {
    if (!settings) return;
    try {
      await apiRequest("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ paused: !settings.paused }),
      });
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveGap() {
    const n = Math.max(1, parseInt(gap || "7", 10) || 7);
    try {
      await apiRequest("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ min_gap_days: n }),
      });
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <div className="grid">
        <div className="card stat"><b>{stats.total}</b><span>إجمالي المحتوى</span></div>
        <div className="card stat"><b>{stats.active}</b><span>مفعّل</span></div>
        <div className="card stat"><b>{stats.eligible}</b><span>جاهز للنشر</span></div>
        <div className="card stat"><b>{stats.week}</b><span>اتنشر آخر 7 أيام</span></div>
      </div>

      {stats.eligible < 3 && (
        <div className="card">
          <span className="badge warn">تنبيه</span>{" "}
          المخزون قليل ({stats.eligible} جاهز). ضيف فيديوهات أو كابشنات جديدة من صفحة المحتوى.
        </div>
      )}

      <div className="card">
        <h2>التحكم</h2>
        <div className="row">
          <button className="btn" onClick={publishNow} disabled={busy}>
            {busy ? "بينشر..." : "انشر الفيديو الجاي دلوقتي"}
          </button>
          <button className="btn ghost" onClick={togglePause}>
            {settings?.paused ? "▶ شغّل النشر الأوتوماتيك" : "⏸ وقّف النشر الأوتوماتيك"}
          </button>
          {settings?.paused && <span className="badge warn">موقوف</span>}
        </div>
        <label>أقل عدد أيام قبل ما نفس الفيديو يتنشر تاني</label>
        <div className="row">
          <input style={{ width: 90 }} type="number" min={1} value={gap} onChange={(e) => setGap(e.target.value)} />
          <button className="btn ghost small" onClick={saveGap}>حفظ</button>
        </div>
        {msg && <div className="msg">{msg}</div>}
        <p className="muted">
          النشر الأوتوماتيك بيتم من الجدولة (GitHub Actions) في المواعيد اللي إنت محددها هناك.
        </p>
      </div>

      <div className="card">
        <h2>آخر عمليات النشر</h2>
        {posts.length === 0 && <p className="muted">لسه مفيش نشر.</p>}
        {posts.map((p) => (
          <div key={p.id} className="list-item">
            <div className="row">
              <span className={`badge ${p.status === "success" ? "ok" : "err"}`}>
                {p.status === "success" ? "نجح" : "فشل"}
              </span>
              <b>{titleOf(p)}</b>
            </div>
            <div className="muted">
              {fmt(p.created_at)}{" "}
              {p.fb_link && (
                <a href={p.fb_link} target="_blank" rel="noreferrer">فتح البوست</a>
              )}
            </div>
            {p.error && <div className="muted" style={{ color: "var(--danger)" }}>{p.error}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
