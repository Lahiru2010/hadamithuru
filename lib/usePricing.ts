// lib/usePricing.ts — 💰 Browser එකේ pricing settings (app_settings → නැත්නම් default)
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { DEFAULT_PRICING, normalizePricing, type Pricing } from "@/lib/pricing";

let cache: Pricing | null = null;

export function usePricing() {
  const [pricing, setPricing] = useState<Pricing>(cache ?? DEFAULT_PRICING);
  useEffect(() => {
    let active = true;
    Promise.resolve(createClient().from("app_settings").select("value").eq("key", "pricing").maybeSingle())
      .then(({ data }) => {
        const p = normalizePricing(data?.value);
        cache = p;
        if (active) setPricing(p);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return pricing;
}
