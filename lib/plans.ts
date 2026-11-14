// lib/plans.ts
// ⚠️ SAMPLE පැකේජ — මිල ගණන් සහ පහසුකම් launch කරන්න කලින් ඔයාට ඕන විදිහට වෙනස් කරන්න.
// දැනට payments සම්බන්ධ කරලා නෑ. Free පැකේජයේ කැමැත්ත සීමාව = මාසයකට 5 (update-65 — lib/interest-limit.ts + SQL trigger).
export type PlanId = "free" | "gold" | "platinum";

export const PLANS: { id: PlanId; priceLkr: number; months: number | null; popular?: boolean; features: string[] }[] = [
  { id: "free", priceLkr: 0, months: null, features: ["f_profile", "f_browse", "f_interests5", "f_chat", "f_photos"] },
  // 👇 update-28: මාසිකව — Gold LKR 990, Platinum LKR 1,500
  //    (Platinum එකේ "Verified ලකුණ" අයින් කළා — තහවුරු වීම හැමෝටම නොමිලේ, විශ්වාසය මුදලට විකුණන්නේ නෑ)
  { id: "gold", priceLkr: 990, months: 1, popular: true, features: ["f_everythingFree", "f_unlimited", "f_highlight", "f_seeAll", "f_support"] },
  { id: "platinum", priceLkr: 1500, months: 1, features: ["f_everythingGold", "f_top", "f_boost", "f_assist"] },
];
