"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase-browser";

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
    sb()
      .auth.getSession()
      .then(({ data }) => {
        if (!data.session) router.replace("/login");
        else setReady(true);
      });
  }, [router]);

  async function logout() {
    await sb().auth.signOut();
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
