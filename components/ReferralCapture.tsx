// components/ReferralCapture.tsx — 🎁 ?ref=CODE එකෙන් ආවොත් code එක මතක තියාගෙන, login වුණාම claim කරනවා
// (register page එකේ ඉඳන් Google / Facebook login කළත් වැඩ කරනවා — browser එකේ දවස් 7ක් තියාගන්නවා)
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/client";

const KEY = "seneha_ref";

export default function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref)) localStorage.setItem(KEY, JSON.stringify({ code: ref.toUpperCase(), until: Date.now() + 7 * 86400_000 }));

    const sb = createClient();
    const tryClaim = async () => {
      let saved: { code: string; until: number } | null = null;
      try { saved = JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { /* නොසලකා හරිනවා */ }
      if (!saved || Date.now() > saved.until) { localStorage.removeItem(KEY); return; }
      const { data } = await sb.auth.getSession();
      if (!data.session) return;
      const { error } = await sb.rpc("claim_referral", { p_code: saved.code });
      // සාර්ථක වුණත් නැතත් (තමන්ගේම code, පරණ account) ආයේ try කරන්නේ නෑ — error එකක් නම් (SQL නෑ) විතරක් තියාගන්නවා
      if (!error) localStorage.removeItem(KEY);
    };
    tryClaim();
    const { data: sub } = sb.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN") setTimeout(tryClaim, 1500); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
