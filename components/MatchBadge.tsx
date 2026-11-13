// components/MatchBadge.tsx
// Browse tile එකේ photo එක උඩ පේන "💞 82%" badge එක
"use client";

import { HeartHandshake } from "lucide-react";
import { matchTier } from "@/lib/match";

const TIER_CLASS = {
  great: "bg-green-600/90 text-white",
  good: "bg-primary/90 text-white",
  fair: "bg-black/55 text-white",
};

export default function MatchBadge({ percent, label }: { percent: number; label?: string }) {
  return (
    <span
      title={label}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shadow-md backdrop-blur-md ${TIER_CLASS[matchTier(percent)]}`}
    >
      <HeartHandshake className="h-3 w-3" /> {percent}%
    </span>
  );
}
