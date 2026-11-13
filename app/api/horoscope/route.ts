// app/api/horoscope/route.ts — 🔮 මගේ කේන්දරය (profile_private.horoscope — කාටවත් පේන්නේ නෑ)
// GET → { horoscope, birth: { date, time, place } }  ·  POST { horoscope } → save
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { isHoroscope } from "@/lib/porondam";

export const runtime = "nodejs";

async function me() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function GET() {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await createAdminClient().from("profile_private").select("*").eq("user_id", uid).maybeSingle();
  return NextResponse.json({
    horoscope: (data as { horoscope?: unknown } | null)?.horoscope ?? null,
    birth: { date: data?.birth_date ?? "", time: String(data?.birth_time ?? "").slice(0, 5), place: data?.birth_place ?? "" },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const h = body?.horoscope;
  if (!isHoroscope(h)) return NextResponse.json({ error: "Invalid horoscope" }, { status: 400 });
  const clean = { ...h, updated_at: new Date().toISOString() };
  const admin = createAdminClient();
  const { data: row } = await admin.from("profile_private").select("user_id").eq("user_id", uid).maybeSingle();
  const { error } = row
    ? await admin.from("profile_private").update({ horoscope: clean }).eq("user_id", uid)
    : await admin.from("profile_private").insert({ user_id: uid, horoscope: clean });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
