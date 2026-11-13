// components/VerifiedBadge.tsx
// ✅ "තහවුරුයි" ලකුණ — site එක පුරාම එකම විදිහට (browse, popup, interests, chat, navbar)
//   icon  → නමට ළඟින් පොඩි නිල් ලකුණ (tooltip එක්ක)
//   pill  → "✓ තහවුරුයි" (photo එක උඩ වගේ තැන්වලට)
//   large → popup එකේ නම ළඟ, ලොකුවට + shine
"use client";

import { BadgeCheck } from "lucide-react";
import { useLang } from "@/components/providers";

export default function VerifiedBadge({ variant = "icon", className = "" }: { variant?: "icon" | "pill" | "large"; className?: string }) {
  const { t } = useLang();
  const label = t.extra.verifiedTile;
  const title = t.extra.verifiedHint;

  if (variant === "icon") {
    return (
      <span title={title} aria-label={label} role="img" className={`inline-flex shrink-0 ${className}`}>
        <BadgeCheck className="h-[1.1em] w-[1.1em] fill-[#1D9BF0] text-white drop-shadow-sm" />
      </span>
    );
  }
  if (variant === "large") {
    return (
      <span title={title} className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#1D9BF0] to-[#2563EB] px-3 py-1 text-sm font-bold text-white shadow-lg shadow-blue-600/30 ring-2 ring-white/40 ${className}`}>
        <BadgeCheck className="h-4 w-4 fill-white text-[#1D9BF0]" /> {label}
        {/* ✨ මෘදු shine එකක් (reduce motion නම් නෑ) */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/30 motion-safe:animate-[verified-shine_3.5s_ease-in-out_infinite]" />
      </span>
    );
  }
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full bg-[#1D9BF0] px-2 py-0.5 text-[11px] font-bold text-white shadow-md ring-1 ring-white/60 ${className}`}>
      <BadgeCheck className="h-3.5 w-3.5 fill-white text-[#1D9BF0]" /> {label}
    </span>
  );
}
