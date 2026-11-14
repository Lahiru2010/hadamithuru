// lib/verified-hint.ts — ✅ update-59: "මම verify වෙලාද" කියන මතක් කිරීම browser එකේ (localStorage)
//   Navbar එක DB එකෙන් දැනගත්තම මෙතන ලියනවා. Pricing වගේ pages වලට load වෙනකම් ඉන්නේ නැතුව
//   කෙලින්ම "Get verified" offer එක පෙන්නන්නද නැද්ද කියලා දැනගන්න පුළුවන් (පෙනිලා අතුරුදහන් වෙන්නේ නෑ).
"use client";

import { useSyncExternalStore } from "react";

const KEY = "hm_verified";
const EVENT = "hm-verified-hint";

export function setVerifiedHint(v: boolean | null) {
  try {
    if (v === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(EVENT));
  } catch { /* private mode */ }
}

function read(): "1" | "0" | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "1" || v === "0" ? v : null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

/** "1" = verified · "0" = verify වෙලා නෑ · null = දන්නේ නෑ (login නෑ / තාම බලලා නෑ) */
export function useVerifiedHint() {
  return useSyncExternalStore(subscribe, read, () => null);
}
