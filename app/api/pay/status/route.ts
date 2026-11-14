// app/api/pay/status/route.ts — 💳 update-67: මගේ ගෙවීමේ තත්ත්වය (return page එක poll කරනවා)
// GET ?order=HM-...  → { status, item, months, days, amount, grantedUntil }
// POST { order, cancelled: true } → user "Cancel" කරලා ආපහු ආවොත් pending එක cancelled කරනවා
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

async function me() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function GET(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const order = new URL(req.url).searchParams.get("order") ?? "";
  const admin = createAdminClient();
  const { data } = await admin.from("payments").select("status, item, months, days, amount, granted_until").eq("order_id", order).eq("user_id", uid).maybeSingle();
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(
    { status: data.status, item: data.item, months: data.months, days: data.days, amount: Number(data.amount), grantedUntil: data.granted_until },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const order = String(body?.order ?? "");
  if (!order || !body?.cancelled) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("payments").update({ status: "cancelled", status_message: "cancelled_by_user" }).eq("order_id", order).eq("user_id", uid).eq("status", "pending");
  return NextResponse.json({ ok: true });
}
