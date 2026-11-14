// lib/contact-settings.ts — 🟢 update-65: WhatsApp අංකය (admin panel → Customer support එකෙන් වෙනස් කරන්න පුළුවන්)
//   app_settings table එකේ key = "contact" → { whatsapp: "0716543234" }. DB එකේ නැත්නම් පහළ default එක.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export const DEFAULT_WHATSAPP = "0716543234";
export type ContactSettings = { whatsapp: string };

/** "071 654 3234" / "+94716543234" → "94716543234" (wa.me link එකට) */
export function waNumber(raw: string) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "94" + d.slice(1);
  return d;
}
export const waLink = (raw: string, text?: string) => `https://wa.me/${waNumber(raw)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

let cache: ContactSettings | null = null;

export function useContactSettings() {
  const [s, setS] = useState<ContactSettings>(cache ?? { whatsapp: DEFAULT_WHATSAPP });
  useEffect(() => {
    if (cache) return;
    let active = true;
    Promise.resolve(createClient().from("app_settings").select("value").eq("key", "contact").maybeSingle())
      .then(({ data }) => {
        const v = (data?.value ?? {}) as Partial<ContactSettings>;
        cache = { whatsapp: String(v.whatsapp || DEFAULT_WHATSAPP) };
        if (active) setS(cache);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return s;
}
