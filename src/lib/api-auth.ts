import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";

export async function isAuthorized(req: Request): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const { data, error } = await admin().auth.getUser(token);
  return !error && !!data.user;
}

export function unauthorized() {
  return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status: 500 });
}
