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
  return NextResponse.json({ error: message }, { status: 500 });
}
