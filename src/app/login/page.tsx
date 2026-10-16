"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLockup, Icon } from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "تعذر تسجيل الدخول. راجع بياناتك وحاول مرة أخرى.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back-link"><Icon name="arrow" size={16} /> العودة إلى الموقع</Link>
      <section className="auth-layout">
        <div className="auth-brand-panel">
          <Link href="/" className="auth-panel-brand"><BrandLockup subtitle /></Link>
          <div className="auth-panel-content"><span className="auth-overline"><Icon name="spark" size={15} /> مساحة عملك، بشكل أوضح</span><h1>كل محتواك.<br /><span>تحت سيطرتك.</span></h1><p>ادخل إلى KEMEX-HUB وتابع مكتبة المحتوى والنشر وسجل العمليات من لوحة واحدة.</p><div className="auth-feature-list"><div><span><Icon name="check" size={16} /></span> مكتبة المحتوى والكابشنات</div><div><span><Icon name="check" size={16} /></span> متابعة عمليات النشر</div><div><span><Icon name="check" size={16} /></span> اتصال آمن بقاعدة Neon</div></div></div>
          <div className="auth-panel-footer"><span className="auth-panel-orb" /><small>مساحة عمل منظمة لفريقك</small><small>© {new Date().getFullYear()} KEMEX-HUB</small></div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand"><BrandLockup subtitle /></div>
            <span className="form-kicker">مرحبًا بعودتك</span>
            <h2>تسجيل الدخول</h2>
            <p className="auth-lead">أدخل بيانات حسابك للعودة إلى مساحة العمل.</p>
            <form className="auth-form" onSubmit={submit}>
              <label htmlFor="email">البريد الإلكتروني</label>
              <div className="input-with-icon"><span><Icon name="mail" size={18} /></span><input id="email" type="email" autoComplete="email" inputMode="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} dir="ltr" /></div>
              <div className="label-row"><label htmlFor="password">كلمة المرور</label><span className="secure-label"><Icon name="shield" size={14} /> اتصال محمي</span></div>
              <div className="input-with-icon password-control"><span><Icon name="lock" size={18} /></span><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="أدخل كلمة المرور" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={1024} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "إخفاء" : "إظهار"}</button></div>
              {error && <div className="auth-alert" role="alert"><span>!</span>{error}</div>}
              <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" /> جارٍ تسجيل الدخول...</> : <>دخول إلى مساحة العمل <Icon name="arrow" size={18} /></>}</button>
            </form>
            <div className="auth-switch"><span>ليس لديك حساب؟</span><Link href="/register">إنشاء حساب جديد</Link></div>
            <p className="auth-legal"><Icon name="shield" size={15} /> بياناتك تُستخدم لتسجيل الدخول وإدارة جلسة العمل فقط.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
