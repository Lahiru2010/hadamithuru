// app/api/stories/[id]/route.ts — 💍 සහකරු කතාව තහවුරු කරනවා
// GET  → කතාව (සහකරුට / එවපු කෙනාට විතරයි)  ·  POST { confirm: true|false } → සහකරු "ඔව්, අපි විවාහ වුණා" / "නෑ"
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

async function load(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  const admin = createAdminClient();
  const { data: s } = await admin.from("success_stories").select("*").eq("id", id).maybeSingle();
  return { me, s, admin };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, s, admin } = await load(id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!s || (s.partner_id !== me && s.user_id !== me)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: from } = await admin.from("profiles").select("full_name").eq("id", s.user_id).maybeSingle();
  const photo = s.photo_path ? (await admin.storage.from("success-stories").createSignedUrl(s.photo_path, 600)).data?.signedUrl ?? null : null;
  return NextResponse.json({ story: { ...s, photo_url: photo, from_name: from?.full_name ?? "" }, isPartner: s.partner_id === me }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, s, admin } = await load(id);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!s || s.partner_id !== me) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const confirm = body?.confirm === true;
  const { error } = await admin.from("success_stories").update(
    confirm ? { partner_confirmed_at: new Date().toISOString() } : { status: "rejected", admin_note: "Partner declined" },
  ).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, confirmed: confirm });
}
