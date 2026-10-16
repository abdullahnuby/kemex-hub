import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function isAuthorized(req: Request): Promise<boolean> {
  return !!readSession(req);
}

export function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("API request failed:", message);
  return NextResponse.json(
    { error: "حدث خطأ أثناء تنفيذ الطلب. حاول مرة أخرى، وإذا استمرت المشكلة راجع سجل الخادم." },
    { status: 500 }
  );
}
