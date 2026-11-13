// components/FoundingBadge.tsx — 👑 "ආරම්භක සාමාජික #12" (පළමු verified සාමාජිකයින්ට)
"use client";

import { Crown } from "lucide-react";
import { useLang } from "@/components/providers";

export default function FoundingBadge({ number, variant = "pill", className = "" }: { number?: number | null; variant?: "pill" | "large" | "icon"; className?: string }) {
  const { t } = useLang();
  const O = t.offer;
  const label = `${O.foundingBadge}${number ? ` #${number}` : ""}`;
  if (variant === "icon") {
    return (
      <span title={`${label} — ${O.foundingHint}`} role="img" aria-label={label} className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md ring-1 ring-white/70 ${className}`}>
        <Crown className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span title={O.foundingHint} className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-bold text-amber-950 shadow-md ring-1 ring-white/60 ${variant === "large" ? "px-3 py-1 text-sm shadow-amber-500/30" : "px-2 py-0.5 text-[11px]"} ${className}`}>
      <Crown className={variant === "large" ? "h-4 w-4" : "h-3.5 w-3.5"} /> {label}
    </span>
  );
}
