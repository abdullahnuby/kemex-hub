import { NextResponse } from "next/server";
import { apiError, isAuthorized, unauthorized } from "@/lib/api-auth";
import { database } from "@/lib/neon";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Context) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "نص الكابشن مطلوب" }, { status: 400 });
    const rows = await database()`
      UPDATE captions SET text = ${text} WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ error: "الكابشن غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request, { params }: Context) {
  if (!(await isAuthorized(req))) return unauthorized();

  try {
    const { id } = await params;
    const rows = await database()`
      DELETE FROM captions WHERE id = ${id} RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ error: "الكابشن غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
