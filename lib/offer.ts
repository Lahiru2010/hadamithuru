// lib/offer.ts
// 🎁 Founding member + verify reward offer එකේ අගයන් (UI එකට). ⚠️ DB function එකේ (20261118_founding_rewards.sql) අගයනුත් මේවාටම සමාන කරන්න.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export const FOUNDING_LIMIT = 50;    // 👈 පළමු verified users කීයටද (update-28: 500 → 50)
export const FOUNDING_MONTHS = 1;    // 👈 ඒ අයට Premium මාස කීයද (update-28: 3 → 1)
export const VERIFY_REWARD_MONTHS = 0; // 👈 ඊට පස්සේ verify වෙන අයට (0 = කිසිවක් නෑ — offer එක Founding 50ට විතරයි)
export const OFFER_ACTIVE = (spotsLeft: number | null) => spotsLeft === null || spotsLeft > 0 || VERIFY_REWARD_MONTHS > 0;

// 👇 ඉතුරු Founding ස්ථාන ගණන (ඇත්ත ගණන DB එකෙන් — ව්‍යාජ අංක නෑ). SQL එක run කරලා නැත්නම් null.
let cache: number | null | undefined;
let pending: Promise<number | null> | null = null;

export function useFoundingSpotsLeft() {
  const [left, setLeft] = useState<number | null>(cache ?? null);
  useEffect(() => {
    if (cache !== undefined) return;
    if (!pending) {
      pending = Promise.resolve(createClient().rpc("founding_spots_left"))
        .then(({ data, error }) => (error || typeof data !== "number" ? null : data))
        .catch(() => null)
        .then((n) => (cache = n));
    }
    let active = true;
    pending.then((n) => { if (active) setLeft(n); });
    return () => { active = false; };
  }, []);
  return left;
}
