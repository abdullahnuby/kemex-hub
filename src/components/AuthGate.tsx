"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLockup, Icon } from "@/components/Brand";

const LINKS = [
  { href: "/dashboard", label: "نظرة عامة", icon: "home" },
  { href: "/videos", label: "مكتبة المحتوى", icon: "library" },
  { href: "/history", label: "سجل النشر", icon: "history" },
];
const PAGE_META: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "نظرة عامة", description: "تابع حالة المحتوى وعمليات النشر من مكان واحد." },
  "/videos": { title: "مكتبة المحتوى", description: "أدر الصور والفيديوهات والريلز والكابشنات الخاصة بك." },
  "/history": { title: "سجل النشر", description: "راجع العمليات السابقة وحالة كل منشور." },
};

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const meta = PAGE_META[path] ?? PAGE_META["/dashboard"];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const result = await response.json();
        if (active) {
          setEmail(typeof result.email === "string" ? result.email : "");
          setReady(true);
        }
      })
      .catch(() => router.replace("/login"));
    return () => { active = false; };
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (!ready) return <div className="app-loading"><span className="loading-orbit" /><p>جارٍ تجهيز مساحة العمل...</p></div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand"><BrandLockup subtitle /></Link>
        <div className="workspace-label">مساحة العمل</div>
        <nav className="sidebar-nav" aria-label="قائمة المنصة">
          {LINKS.map((link) => <Link key={link.href} href={link.href} aria-label={link.label} title={link.label} className={`sidebar-link ${path === link.href ? "active" : ""}`}><Icon name={link.icon} size={19} /><span>{link.label}</span>{path === link.href && <span className="active-indicator" />}</Link>)}
        </nav>
        <div className="sidebar-bottom-card"><span className="sidebar-bottom-icon"><Icon name="shield" size={19} /></span><b>مساحة عمل آمنة</b><p>بيانات الاتصال بقاعدة البيانات محفوظة على الخادم.</p></div>
        <div className="sidebar-account"><span className="account-avatar">{email.slice(0, 1).toUpperCase() || "K"}</span><span className="account-copy"><b>حسابك</b><small title={email}>{email || "عضو مساحة العمل"}</small></span><button type="button" className="icon-button logout-button" onClick={logout} disabled={loggingOut} aria-label="تسجيل الخروج" title="تسجيل الخروج"><Icon name="logout" size={18} /></button></div>
      </aside>
      <div className="app-main">
        <header className="app-topbar"><div className="mobile-brand"><BrandLockup size={34} /></div><div className="breadcrumb"><span>KEMEX-HUB</span><b>/</b><strong>{meta.title}</strong></div><div className="topbar-right"><span className="topbar-status"><i /> جلسة نشطة</span><span className="topbar-divider" /><Link href="/" className="view-site-link">الموقع التعريفي <Icon name="arrow" size={15} /></Link><button type="button" className="topbar-logout" onClick={logout} disabled={loggingOut} aria-label="تسجيل الخروج" title="تسجيل الخروج"><Icon name="logout" size={17} /></button></div></header>
        <main className="app-content"><div className="page-intro"><div><span className="page-eyebrow">KEMEX-HUB / مساحة العمل</span><h1>{meta.title}</h1><p>{meta.description}</p></div>{path !== "/history" && path !== "/videos" && <Link href="/videos" className="button button-primary"><Icon name="plus" size={17} /> إدارة المحتوى</Link>}</div>{children}</main>
        <footer className="app-footer"><span>© {new Date().getFullYear()} KEMEX-HUB</span><span>إدارة المحتوى والنشر بوضوح أكبر</span></footer>
      </div>
    </div>
  );
}
