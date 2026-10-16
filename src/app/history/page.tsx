"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiRequest, fmt } from "@/lib/client";

type Row = {
  id: string;
  status: string;
  kind: string | null;
  fb_link: string | null;
  error: string | null;
  created_at: string;
  video_title: string | null;
  caption_text: string | null;
};

export default function HistoryPage() {
  return (
    <AuthGate>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Row[]>("/api/history")
      .then((data) => {
        setRows(data);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <h1>سجل النشر</h1>
      {error && <div className="msg" style={{ color: "var(--danger)" }}>{error}</div>}
      {loading && <p className="muted center">جاري التحميل...</p>}
      {!loading && rows.length === 0 && <p className="muted center">لسه مفيش نشر.</p>}
      {rows.map((r) => {
        return (
          <div key={r.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b>{r.video_title ?? "(اتمسح)"}</b>
              <span className={`badge ${r.status === "success" ? "ok" : "err"}`}>
                {r.status === "success" ? "نجح" : "فشل"}
              </span>
            </div>
            <div className="muted">
              {fmt(r.created_at)}{" "}
              {r.fb_link && (
                <a href={r.fb_link} target="_blank" rel="noreferrer">فتح البوست</a>
              )}
            </div>
            {r.caption_text && <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{r.caption_text}</p>}
            {r.error && <p style={{ color: "var(--danger)", margin: "8px 0 0" }}>{r.error}</p>}
          </div>
        );
      })}
    </>
  );
}
