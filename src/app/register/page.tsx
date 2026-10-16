"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLockup, Icon } from "@/components/Brand";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("استخدم كلمة مرور من 12 حرفًا على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, inviteCode, password, confirmPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "تعذر إنشاء الحساب. راجع البيانات وحاول مرة أخرى.");
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
      <section className="auth-layout register-layout">
        <div className="auth-brand-panel">
          <Link href="/" className="auth-panel-brand"><BrandLockup subtitle /></Link>
          <div className="auth-panel-content"><span className="auth-overline"><Icon name="spark" size={15} /> ابدأ مساحة عملك</span><h1>تنظيم أفضل<br /><span>يبدأ من هنا.</span></h1><p>أنشئ حسابك لإدارة المحتوى ومتابعة النشر من مساحة عمل واحدة.</p><div className="register-benefit-card"><span className="register-benefit-icon"><Icon name="shield" size={20} /></span><div><b>دعوات آمنة تُنشأ تلقائيًا</b><p>يمكن إنشاء أول حساب عند تهيئة قاعدة بيانات فارغة. بعد ذلك، تُنشأ رموز دعوة مؤقتة من لوحة التحكم ولا تحتاج إلى إعدادها في Vercel.</p></div></div></div>
          <div className="auth-panel-footer"><span className="auth-panel-orb" /><small>آمن. منظم. متصل بـ Neon.</small><small>© {new Date().getFullYear()} KEMEX-HUB</small></div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-wrap register-form-wrap">
            <div className="auth-mobile-brand"><BrandLockup subtitle /></div>
            <span className="form-kicker">خطوة واحدة للبدء</span>
            <h2>إنشاء حساب جديد</h2>
            <p className="auth-lead">أدخل بياناتك ورمز الدعوة للانضمام إلى مساحة العمل.</p>
            <form className="auth-form" onSubmit={submit}>
              <label htmlFor="register-email">البريد الإلكتروني</label>
              <div className="input-with-icon"><span><Icon name="mail" size={18} /></span><input id="register-email" type="email" autoComplete="email" inputMode="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} dir="ltr" /></div>
              <label htmlFor="invite-code">رمز الدعوة <span className="secure-label">اختياري لأول حساب فقط</span></label>
              <div className="input-with-icon"><span><Icon name="key" size={18} /></span><input id="invite-code" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} dir="ltr" placeholder="يُدخل عند الانضمام بدعوة" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} maxLength={256} /></div>
              <div className="label-row"><label htmlFor="register-password">كلمة المرور</label><span className="secure-label">12 حرفًا على الأقل</span></div>
              <div className="input-with-icon password-control"><span><Icon name="lock" size={18} /></span><input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="أنشئ كلمة مرور قوية" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={1024} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "إخفاء" : "إظهار"}</button></div>
              <label htmlFor="confirm-password">تأكيد كلمة المرور</label>
              <div className="input-with-icon"><span><Icon name="check" size={18} /></span><input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="أعد كتابة كلمة المرور" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={1024} /></div>
              {error && <div className="auth-alert" role="alert"><span>!</span>{error}</div>}
              <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" /> جارٍ إنشاء الحساب...</> : <>إنشاء الحساب والمتابعة <Icon name="arrow" size={18} /></>}</button>
            </form>
            <div className="auth-switch"><span>لديك حساب بالفعل؟</span><Link href="/login">تسجيل الدخول</Link></div>
            <p className="auth-legal"><Icon name="shield" size={15} /> يتم تشفير كلمة المرور قبل حفظها في قاعدة البيانات.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
