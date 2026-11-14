// lib/interest-limit.ts — 💌 update-65: Free පැකේජයට මාසයකට කැමැත්ත 5යි (Gold / Premium අයට සීමාවක් නෑ)
//   Browser එකේ check එක ලස්සන පණිවිඩයක් පෙන්නන්න. ඇත්තටම නවත්වන්නේ database trigger එක (20261203_free_interest_limit.sql).
"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_MONTHLY_INTERESTS = 5;

/** මේ මාසයේ (ලංකා වේලාවෙන් 1 වෙනිදා 00:00 ඉඳන්) යවපු කැමැත්ත ගණන + premium ද */
export async function interestQuota(sb: SupabaseClient, uid: string, premiumUntil?: string | null) {
  const premium = !!premiumUntil && new Date(premiumUntil) > new Date();
  if (premium) return { premium: true, used: 0, left: Infinity, allowed: true };
  const now = new Date(Date.now() + 5.5 * 3600_000); // 🇱🇰 UTC+5:30
  const monthStartLk = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3600_000;
  const { count } = await sb
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", uid)
    .gte("created_at", new Date(monthStartLk).toISOString());
  const used = count ?? 0;
  return { premium: false, used, left: Math.max(0, FREE_MONTHLY_INTERESTS - used), allowed: used < FREE_MONTHLY_INTERESTS };
}

/** DB trigger එකෙන් එන error එකද */
export const isLimitError = (e: { message?: string } | null | undefined) => !!e?.message && e.message.includes("free_interest_limit");
