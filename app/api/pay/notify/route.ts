// app/api/pay/notify/route.ts — 💳 update-67: PayHere server එකෙන් එන "notify" එක (user ගේ browser එකෙන් නෙවෙයි)
// ✅ md5sig එක check කරලා, ගෙවීම සාර්ථක නම් (status_code 2) Premium / Boost දෙනවා — complete_payment() SQL function එකෙන් (එක පාරයි)
// ⚠️ මේ URL එක login නැතුව public විදිහට වැඩ කරන්න ඕනේ (PayHere එකට login වෙන්න බෑ)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { payhereConfig, statusFromCode, verifyNotify } from "@/lib/payhere";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const cfg = payhereConfig();
  if (!cfg.enabled) return new NextResponse("not configured", { status: 503 });

  const form = await req.formData().catch(() => null);
  if (!form) return new NextResponse("bad request", { status: 400 });
  const f: Record<string, string> = {};
  form.forEach((v, k) => { f[k] = String(v); });

  if (!verifyNotify(f, cfg.merchantId, cfg.secret)) {
    console.warn("[payhere] invalid signature", f.order_id);
    return new NextResponse("invalid signature", { status: 400 });
  }

  // 🔒 Card අංක වගේ දේවල් save කරන්නේ නෑ — අවශ්‍ය ටික විතරයි
  const raw = {
    payment_id: f.payment_id, status_code: f.status_code, status_message: f.status_message, method: f.method,
    payhere_amount: f.payhere_amount, payhere_currency: f.payhere_currency, card_holder_name: f.card_holder_name ?? null, received_at: new Date().toISOString(),
  };
  const admin = createAdminClient();
  const status = statusFromCode(f.status_code);

  if (status === "paid") {
    const { data, error } = await admin.rpc("complete_payment", {
      p_order: f.order_id, p_payment_id: f.payment_id ?? null, p_method: f.method ?? null,
      p_amount: Number(f.payhere_amount), p_currency: f.payhere_currency, p_raw: raw,
    });
    if (error) {
      console.error("[payhere] complete_payment failed", f.order_id, error.message);
      return new NextResponse("error", { status: 500 }); // PayHere ආයේ උත්සාහ කරනවා
    }
    console.log("[payhere] paid", f.order_id, JSON.stringify(data));
    return new NextResponse("OK");
  }

  if (status !== "pending") {
    // ❌ cancelled / failed / chargeback — දැනටමත් "paid" නම් chargeback විතරක් වෙනස් කරනවා (admin බලලා තීරණය කරනවා)
    const q = admin.from("payments").update({ status, status_message: f.status_message ?? null, payhere_payment_id: f.payment_id ?? null, method: f.method ?? null, raw }).eq("order_id", f.order_id);
    await (status === "chargeback" ? q : q.neq("status", "paid"));
  }
  return new NextResponse("OK");
}
