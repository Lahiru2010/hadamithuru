// lib/payhere.ts — 💳 update-67: PayHere online ගෙවීම් (SERVER එකේ විතරයි — secret එක තියෙන නිසා)
// Vercel env vars:
//   PAYHERE_MERCHANT_ID      — PayHere → Settings → Domains & Credentials එකේ Merchant ID
//   PAYHERE_MERCHANT_SECRET  — ඒ domain එකට PayHere දෙන Merchant Secret (⚠️ කාටවත් පෙන්නන්න / chat එකේ දාන්න එපා)
//   PAYHERE_SANDBOX          — "true" නම් test ගෙවීම් (sandbox.payhere.lk) · live එකේ මේක දාන්නේ නෑ
// Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
import { createHash } from "crypto";
import { normalizePricing, periodPrice } from "@/lib/pricing";

export type PayItem = "gold" | "platinum" | "boost";
export const PAY_ITEMS: PayItem[] = ["gold", "platinum", "boost"];

export function payhereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID?.trim() ?? "";
  const secret = process.env.PAYHERE_MERCHANT_SECRET?.trim() ?? "";
  const sandbox = process.env.PAYHERE_SANDBOX === "true";
  return {
    enabled: !!merchantId && !!secret,
    merchantId,
    secret,
    sandbox,
    checkoutUrl: sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout",
  };
}

const md5 = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();

/** LKR 1,980 → "1980.00" (PayHere ඉල්ලන ආකාරය) */
export const amountStr = (n: number) => n.toFixed(2);

/** Checkout hash = MD5(merchant_id + order_id + amount + currency + MD5(secret)) */
export function checkoutHash(merchantId: string, secret: string, orderId: string, amount: string, currency: string) {
  return md5(merchantId + orderId + amount + currency + md5(secret));
}

/** Notify එක ඇත්තටම PayHere එකෙන්ද? md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret)) */
export function verifyNotify(f: Record<string, string>, merchantId: string, secret: string) {
  if (!f.md5sig || f.merchant_id !== merchantId) return false;
  const expected = md5(f.merchant_id + f.order_id + f.payhere_amount + f.payhere_currency + f.status_code + md5(secret));
  return expected === f.md5sig.toUpperCase();
}

/** 💰 මිල server එකේම ගණන් කරනවා (browser එකෙන් එවන මිලක් විශ්වාස කරන්නේ නෑ) — admin pricing settings වලින් */
export function quote(item: PayItem, pricingRaw: unknown): { amount: number; months: number | null; days: number | null; label: string } | null {
  const pricing = normalizePricing(pricingRaw);
  if (item === "boost") {
    if (!pricing.boost.enabled || pricing.boost.priceLkr <= 0) return null;
    return { amount: pricing.boost.priceLkr, months: null, days: pricing.boost.days, label: `Profile Boost (${pricing.boost.days} days)` };
  }
  const plan = pricing.plans.find((p) => p.id === item);
  if (!plan || plan.enabled === false || plan.priceLkr <= 0) return null;
  const months = plan.months ?? 1;
  const dur = pricing.durations.find((d) => d.months === months) ?? { months, discountPct: 0, enabled: true };
  const { total } = periodPrice(plan.priceLkr, dur);
  const name = item === "gold" ? "Gold" : "Platinum";
  return { amount: total, months, days: null, label: `Hadamithuru ${name} – ${months} month${months > 1 ? "s" : ""}` };
}

/** අපේ order අංකය — උදා: HM-MHZ3K2-7Q4D */
export function newOrderId() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HM-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/** PayHere status_code → අපේ status */
export function statusFromCode(code: string): "paid" | "pending" | "cancelled" | "failed" | "chargeback" {
  switch (code) {
    case "2": return "paid";
    case "0": return "pending";
    case "-1": return "cancelled";
    case "-3": return "chargeback";
    default: return "failed"; // -2 සහ වෙන ඕනෑම එකක්
  }
}
