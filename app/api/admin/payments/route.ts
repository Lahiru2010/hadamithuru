// app/api/admin/payments/route.ts — 🛡️ ADMIN: 💳 PayHere ගෙවීම් (update-67)
// GET ?status=paid|pending|failed|cancelled|chargeback|all  → ගෙවීම් 200ක් + සාරාංශය (මේ මාසයේ / මුළු ආදායම)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";
import { payhereConfig } from "@/lib/payhere";

export const runtime = "nodejs";
const STATUSES = ["paid", "pending", "failed", "cancelled", "chargeback"];

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? "paid";
  const admin = createAdminClient();
  let q = admin.from("payments").select("id, order_id, user_id, item, months, days, amount, currency, status, payhere_payment_id, method, status_message, granted_until, created_at, paid_at").order("created_at", { ascending: false }).limit(200);
  if (STATUSES.includes(status)) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message, payments: [] }, { status: 200 });

  // 💰 ආදායම (paid විතරයි) — මේ මාසය (ලංකා වේලාවෙන්) + මුළු එක
  const { data: paid } = await admin.from("payments").select("amount, paid_at").eq("status", "paid").limit(10000);
  const now = new Date(Date.now() + 5.5 * 3600_000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3600_000);
  const total = (paid ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const month = (paid ?? []).filter((p) => p.paid_at && new Date(p.paid_at) >= monthStart).reduce((s, p) => s + Number(p.amount), 0);

  const ids = [...new Set((data ?? []).map((p) => p.user_id).filter(Boolean))] as string[];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const cfg = payhereConfig();
  return NextResponse.json({
    configured: cfg.enabled,
    sandbox: cfg.sandbox,
    totals: { month, total, count: (paid ?? []).length },
    payments: (data ?? []).map((p) => ({ ...p, amount: Number(p.amount), profile: profiles?.find((x) => x.id === p.user_id) ?? null })),
  }, { headers: { "Cache-Control": "no-store" } });
}
