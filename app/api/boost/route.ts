// app/api/boost/route.ts — ⚡ මගේ Boost
// GET  → { boostedUntil, pending }
// POST → Boost ඉල්ලීමක් (pending — ගෙවීම සම්පූර්ණ වුණාම admin "Activate" කරනවා. Online ගෙවීම් PayHere එක්ක පස්සේ)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { normalizePricing } from "@/lib/pricing";

export const runtime = "nodejs";

async function me() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function GET() {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: p }, { count }, { data: last }] = await Promise.all([
    admin.from("profiles").select("boosted_until").eq("id", uid).maybeSingle(),
    admin.from("boost_requests").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "pending"),
    admin.from("boost_requests").select("activated_at").eq("user_id", uid).eq("status", "active").order("activated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return NextResponse.json({ boostedUntil: p?.boosted_until ?? null, startedAt: last?.activated_at ?? null, pending: (count ?? 0) > 0 }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: s } = await admin.from("app_settings").select("value").eq("key", "pricing").maybeSingle();
  const { boost } = normalizePricing(s?.value);
  if (!boost.enabled) return NextResponse.json({ error: "Boost is not available" }, { status: 400 });
  const { count } = await admin.from("boost_requests").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "pending");
  if ((count ?? 0) > 0) return NextResponse.json({ ok: true, pending: true });
  const { error } = await admin.from("boost_requests").insert({ user_id: uid, days: boost.days, price_lkr: boost.priceLkr });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pending: true });
}
