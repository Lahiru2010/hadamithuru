// lib/pricing.ts — 💰 පැකේජ මිල ගණන් + ⚡ Boost (admin එකෙන් වෙනස් කරන්න පුළුවන් — app_settings table එකේ "pricing")
// DB එකේ නැත්නම් (SQL එක තාම run කරලා නැත්නම්) මෙතන තියෙන default අගයන් පාවිච්චි වෙනවා.
import { PLANS, type PlanId } from "@/lib/plans";

export type Plan = { id: PlanId; priceLkr: number; months: number | null; popular?: boolean; enabled?: boolean; features: string[] };
export type BoostConfig = { priceLkr: number; days: number; enabled: boolean };
// 🗓️ update-65: ගෙවන පැකේජ (Gold / Platinum) — මාස 1 / 2 / 3 / 6 / 12. priceLkr = **මාසයක** මිල, discountPct = එම කාලයට අඩු කරන %
export type Duration = { months: number; discountPct: number; enabled: boolean };
export type Pricing = { plans: Plan[]; boost: BoostConfig; durations: Duration[] };

export const DURATION_MONTHS = [1, 2, 3, 6, 12] as const;
export const DEFAULT_DURATIONS: Duration[] = [
  { months: 1, discountPct: 0, enabled: true },
  { months: 2, discountPct: 20, enabled: true }, // 👈 මාස 2ක් ගත්තොත් 20% අඩුවෙන්
  { months: 3, discountPct: 20, enabled: true },
  { months: 6, discountPct: 20, enabled: true },
  { months: 12, discountPct: 20, enabled: true },
];

export const DEFAULT_PRICING: Pricing = {
  plans: PLANS.map((p) => ({ ...p, enabled: true })),
  boost: { priceLkr: 660, days: 7, enabled: true },
  durations: DEFAULT_DURATIONS,
};

/** 💰 මාස {months} කට මුළු මිල (අඩු කිරීමත් එක්ක) — LKR 10 ට වට කරලා */
export function periodPrice(monthlyLkr: number, d: Duration) {
  const full = monthlyLkr * d.months;
  const total = Math.round((full * (1 - d.discountPct / 100)) / 10) * 10;
  return { full, total, perMonth: Math.round(total / d.months) };
}

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
  const rawDur = Array.isArray(r.durations) ? r.durations : [];
  return {
    plans: plans
      .filter((p) => p && ["free", "gold", "platinum"].includes(p.id))
      .map((p) => ({
        id: p.id,
        // 👇 update-65: පරණ settings එකේ මාස කීපයකට මිලක් තිබ්බොත් මාසයක මිලට හරවනවා
        priceLkr: Math.max(0, Math.round((Number(p.priceLkr) || 0) / (p.months && Number(p.months) > 1 ? Number(p.months) : 1))),
        months: p.months == null || p.id === "free" ? null : 1,
        popular: !!p.popular,
        enabled: p.enabled !== false,
        features: (Array.isArray(p.features) ? p.features : []).filter((f) => (FEATURE_KEYS as readonly string[]).includes(f)),
      })),
    boost: {
      priceLkr: Math.max(0, Math.round(Number(b.priceLkr ?? DEFAULT_PRICING.boost.priceLkr))),
      days: Math.min(90, Math.max(1, Math.round(Number(b.days ?? DEFAULT_PRICING.boost.days)))),
      enabled: b.enabled !== false,
    },
    durations: DURATION_MONTHS.map((m) => {
      const d = (rawDur as Partial<Duration>[]).find((x) => Number(x?.months) === m);
      const def = DEFAULT_DURATIONS.find((x) => x.months === m)!;
      return {
        months: m,
        discountPct: Math.min(90, Math.max(0, Math.round(Number(d?.discountPct ?? def.discountPct) || 0))),
        enabled: m === 1 ? true : d ? d.enabled !== false : def.enabled, // 👈 මාස 1 හැමවිටම තියෙනවා
      };
    }),
  };
}
