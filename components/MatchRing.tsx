// components/MatchRing.tsx
// Profile popup එකේ photo එක උඩ පේන රවුම් ගැලපීමේ ප්‍රතිශතය
"use client";

import { useLang } from "@/components/providers";
import { matchTier } from "@/lib/match";

const COLOR = { great: "#16a34a", good: "#D52047", fair: "#f59e0b" };

export default function MatchRing({ percent }: { percent: number }) {
  const { t } = useLang();
  const M = t.match;
  const tier = matchTier(percent);
  const r = 26, c = 2 * Math.PI * r;

  return (
    <div title={`${M[tier]} · ${M.note}`} className="flex flex-col items-center">
      <div className="relative h-[72px] w-[72px] rounded-full bg-background/85 shadow-xl backdrop-blur-md">
        <svg viewBox="0 0 64 64" className="h-[72px] w-[72px] -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke={COLOR[tier]} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-foreground">{percent}%</span>
      </div>
      <span className="mt-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: COLOR[tier] }}>
        {M[tier]}
      </span>
    </div>
  );
}
