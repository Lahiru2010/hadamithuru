// app/api/report/route.ts — POST { userId, reason, details? } → user කෙනෙක්ව වාර්තා කරනවා (admin ට යනවා)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS = ["fake", "photos", "harass", "scam", "married", "other"];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  const reason = String(body?.reason ?? "");
  const details = body?.details ? String(body.details).slice(0, 1000) : null;
  if (!UUID.test(userId) || userId === me || !REASONS.includes(reason)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const admin = createAdminClient();
  // එකම කෙනාව දවසකට එක පාරයි (spam නොවෙන්න)
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await admin.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", me).eq("reported_id", userId).gte("created_at", since);
  if (count) return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await admin.from("reports").insert({ reporter_id: me, reported_id: userId, reason, details });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
