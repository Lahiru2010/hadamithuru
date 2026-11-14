// components/FaviconBadge.tsx
// 🔔 අලුත් message / notification එකක් තියෙද්දී browser tab එකේ favicon එකට තිතක් + title එකේ "(2)" — වෙන tab එකක ඉන්නකොටත් පේනවා.
// update-68: ඇඳීම lib/favicon-badge.ts එකේ (නිල් තිත). මෙතනින් කරන්නේ navbar එකේ "seneha-unread" event එක (කියවලා නැති messages ගණන) ඒකට දෙන එක විතරයි.
"use client";

import { useEffect } from "react";
import { setFaviconBadge } from "@/lib/favicon-badge";

export default function FaviconBadge() {
  useEffect(() => {
    const onUnread = (e: Event) => setFaviconBadge("messages", Math.max(0, Number((e as CustomEvent<number>).detail) || 0));
    window.addEventListener("seneha-unread", onUnread);
    return () => window.removeEventListener("seneha-unread", onUnread);
  }, []);
  return null;
}
