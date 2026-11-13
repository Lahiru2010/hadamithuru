// lib/pricing.ts — 💰 පැකේජ මිල ගණන් + ⚡ Boost (admin එකෙන් වෙනස් කරන්න පුළුවන් — app_settings table එකේ "pricing")
// DB එකේ නැත්නම් (SQL එක තාම run කරලා නැත්නම්) මෙතන තියෙන default අගයන් පාවිච්චි වෙනවා.
import { PLANS, type PlanId } from "@/lib/plans";

export type Plan = { id: PlanId; priceLkr: number; months: number | null; popular?: boolean; enabled?: boolean; features: string[] };
export type BoostConfig = { priceLkr: number; days: number; enabled: boolean };
export type Pricing = { plans: Plan[]; boost: BoostConfig };

export const DEFAULT_PRICING: Pricing = {
  plans: PLANS.map((p) => ({ ...p, enabled: true })),
  boost: { priceLkr: 660, days: 7, enabled: true },
};

// 👇 පැකේජ වලට දාන්න පුළුවන් පහසුකම් (i18n plans.f_* keys)
export const FEATURE_KEYS = [
  "f_profile", "f_browse", "f_interests5", "f_chat", "f_photos",
  "f_everythingFree", "f_unlimited", "f_highlight", "f_seeAll", "f_support",
  "f_everythingGold", "f_top", "f_boost", "f_assist",
] as const;

/** DB එකෙන් ආපු අගය හරිද කියලා බලලා, වැරදි / නැති කොටස් default වලින් පුරවනවා */
export function normalizePricing(raw: unknown): Pricing {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Pricing>;
  const plans = Array.isArray(r.plans) && r.plans.length ? r.plans : DEFAULT_PRICING.plans;
  const b = (r.boost ?? {}) as Partial<BoostConfig>;
  return {
    plans: plans
      .filter((p) => p && ["free", "gold", "platinum"].includes(p.id))
      .map((p) => ({
        id: p.id,
        priceLkr: Math.max(0, Math.round(Number(p.priceLkr) || 0)),
        months: p.months == null ? null : Math.max(1, Math.round(Number(p.months) || 1)),
        popular: !!p.popular,
        enabled: p.enabled !== false,
        features: (Array.isArray(p.features) ? p.features : []).filter((f) => (FEATURE_KEYS as readonly string[]).includes(f)),
      })),
    boost: {
      priceLkr: Math.max(0, Math.round(Number(b.priceLkr ?? DEFAULT_PRICING.boost.priceLkr))),
      days: Math.min(90, Math.max(1, Math.round(Number(b.days ?? DEFAULT_PRICING.boost.days)))),
      enabled: b.enabled !== false,
    },
  };
}
