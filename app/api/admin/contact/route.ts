// app/api/admin/contact/route.ts — 🛡️ ADMIN ONLY: "අප අමතන්න" form පණිවිඩ (update-59)
// GET                     → අලුත්ම පණිවිඩ 200
// PATCH { id, status }    → "new" | "read" | "done"
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await createAdminClient()
    .from("contact_messages")
    .select("id, name, email, phone, topic, message, user_id, lang, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ messages: [], error: error.message }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ messages: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const status = String(body?.status ?? "");
  if (!UUID.test(id) || !["new", "read", "done"].includes(status)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { error } = await createAdminClient().from("contact_messages").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
