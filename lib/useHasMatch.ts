// lib/useHasMatch.ts — 💍 update-64: මට කවදාහරි ගැලපීමක් (accept වුණ කැමැත්තක්) තිබ්බද
//   "ඔබේ ආදර කතාව බෙදාගන්න" (Share your story) පෙන්වන්නේ ගැලපීමක් තියෙන අයට විතරයි.
//   null = තාම දන්නේ නෑ (load වෙනකම් පෙන්වන්නේ නෑ)
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

let cache: { uid: string; has: boolean } | null = null;

export function useHasMatch(userId?: string | null) {
  const [has, setHas] = useState<boolean | null>(cache && userId && cache.uid === userId ? cache.has : null);
  useEffect(() => {
    let active = true;
    const sb = createClient();
    const load = async () => {
      const uid = userId ?? (await sb.auth.getSession()).data.session?.user.id ?? null;
      if (!uid) { if (active) setHas(false); return; }
      if (cache?.uid === uid) { if (active) setHas(cache.has); return; }
      const { count } = await sb
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`);
      cache = { uid, has: (count ?? 0) > 0 };
      if (active) setHas(cache.has);
    };
    load();
    // 👇 අලුතින් match වුණාම (accept කළාම) ආයේ බලනවා
    const refresh = () => { cache = null; load(); };
    window.addEventListener("refresh_interests_status", refresh);
    return () => { active = false; window.removeEventListener("refresh_interests_status", refresh); };
  }, [userId]);
  return has;
}
