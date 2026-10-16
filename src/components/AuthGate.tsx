"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/videos", label: "المحتوى" },
  { href: "/history", label: "السجل" },
];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) router.replace("/login");
        else setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/login");
  }

  if (!ready) return <p className="muted center">جاري التحميل...</p>;

  return (
    <>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
        <span className="spacer" />
        <button onClick={logout}>خروج</button>
      </nav>
      <main className="container">{children}</main>
    </>
  );
}
