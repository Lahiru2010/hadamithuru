// lib/usePayConfig.ts — 💳 update-67: PayHere සකස් කරලාද? (Vercel env vars තියෙනවද) — browser එකට
// { enabled: false } නම් පරණ විදිහටම ("ළඟදීම" / Boost ඉල්ලීම) වැඩ කරනවා
"use client";

import { useEffect, useState } from "react";

type PayConfig = { enabled: boolean; sandbox: boolean; loaded: boolean };
let cache: PayConfig | null = null;

export function usePayConfig() {
  const [cfg, setCfg] = useState<PayConfig>(cache ?? { enabled: false, sandbox: false, loaded: false });
  useEffect(() => {
    if (cache) return;
    let active = true;
    fetch("/api/pay/checkout", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        cache = { enabled: !!d?.enabled, sandbox: !!d?.sandbox, loaded: true };
        if (active) setCfg(cache);
      })
      .catch(() => active && setCfg({ enabled: false, sandbox: false, loaded: true }));
    return () => { active = false; };
  }, []);
  return cfg;
}
