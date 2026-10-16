"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) setErr(result.error ?? "تعذر تسجيل الدخول");
      else router.replace("/");
    } catch {
      setErr("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>KEMEX HUB</h1>
      <form className="card" onSubmit={submit}>
        <label>الإيميل</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>الباسورد</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy}>
            {busy ? "..." : "دخول"}
          </button>
        </div>
        {err && <div className="msg">{err}</div>}
      </form>
    </main>
  );
}
