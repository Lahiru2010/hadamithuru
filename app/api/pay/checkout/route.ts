// app/api/pay/checkout/route.ts — 💳 update-67: PayHere ගෙවීමක් පටන් ගන්නවා
// POST { item: "gold" | "platinum" | "boost" }
//   → payments table එකේ "pending" record එකක් + PayHere form එකට ඕන fields (hash එකත් එක්ක)
//   → browser එක ඒ fields PayHere checkout page එකට POST කරනවා (lib/payhere-client.ts)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { PAY_ITEMS, amountStr, checkoutHash, newOrderId, payhereConfig, quote, type PayItem } from "@/lib/payhere";

export const runtime = "nodejs";

function siteOrigin(req: Request) {
  // 👇 Staging එකෙන් ආවොත් staging එකටම, live එකෙන් ආවොත් live එකටම ආපහු එනවා
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

// GET → { enabled, sandbox } — browser එකට (secret එක යවන්නේ නෑ)
export async function GET() {
  const cfg = payhereConfig();
  return NextResponse.json({ enabled: cfg.enabled, sandbox: cfg.sandbox }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const cfg = payhereConfig();
  if (!cfg.enabled) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub as string | undefined;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const item = String(body?.item ?? "") as PayItem;
  if (!PAY_ITEMS.includes(item)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const admin = createAdminClient();

  // 🛑 එක පැයකට උපරිම ගෙවීම් උත්සාහ 10ක් (button එක ආයේ ආයේ එබුවොත්)
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("payments").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", hourAgo);
  if ((count ?? 0) >= 10) return NextResponse.json({ error: "too_many" }, { status: 429 });

  const [{ data: s }, { data: p }, { data: priv }] = await Promise.all([
    admin.from("app_settings").select("value").eq("key", "pricing").maybeSingle(),
    admin.from("profiles").select("full_name, email, city, district").eq("id", uid).maybeSingle(),
    admin.from("profile_private").select("phone").eq("user_id", uid).maybeSingle(),
  ]);
  const q = quote(item, s?.value);
  if (!q) return NextResponse.json({ error: "unavailable" }, { status: 400 });

  const email = String(p?.email ?? claims?.claims?.email ?? "").trim();
  const nameParts = String(p?.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "Member";
  const lastName = nameParts.slice(1).join(" ") || "-";
  const city = String(p?.city ?? p?.district ?? "").trim() || "Colombo";
  const phone = String(priv?.phone ?? "").replace(/[^\d+]/g, "") || "0000000000"; // PayHere එකට phone එකක් ඕනේ

  const orderId = newOrderId();
  const amount = amountStr(q.amount);
  const currency = "LKR";
  const { error } = await admin.from("payments").insert({
    order_id: orderId, user_id: uid, item, months: q.months, days: q.days, amount: q.amount, currency, status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin = siteOrigin(req);
  return NextResponse.json({
    action: cfg.checkoutUrl,
    fields: {
      merchant_id: cfg.merchantId,
      return_url: `${origin}/payment/return?order_id=${orderId}`,
      cancel_url: `${origin}/payment/return?order_id=${orderId}&cancelled=1`,
      notify_url: `${origin}/api/pay/notify`,
      order_id: orderId,
      items: q.label,
      currency,
      amount,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      address: city,
      city,
      country: "Sri Lanka",
      custom_1: item,
      hash: checkoutHash(cfg.merchantId, cfg.secret, orderId, amount, currency),
    },
  });
}
