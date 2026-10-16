import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KEMEX-HUB | إدارة المحتوى والنشر",
    template: "%s | KEMEX-HUB",
  },
  description: "منصة منظمة لإدارة مكتبة المحتوى والكابشنات والنشر على فيسبوك ومتابعة سجل العمليات.",
  applicationName: "KEMEX-HUB",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101d35",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
