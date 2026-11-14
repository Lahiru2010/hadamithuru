// components/MiniMatchRing.tsx — පොඩි රවුම් ගැලපීමේ ප්‍රතිශතය (Browse tiles / suggestions)
"use client";

import { matchTier } from "@/lib/match";

export const MATCH_COLOR = { great: "#16a34a", good: "#D52047", fair: "#f59e0b" };

export default function MiniMatchRing({ percent, title, size = 44, onDark = false }: { percent: number; title?: string; size?: number; onDark?: boolean }) {
  const color = MATCH_COLOR[matchTier(percent)];
  const r = 16, c = 2 * Math.PI * r;
  return (
    <div title={title} className={`relative shrink-0 rounded-full ${onDark ? "bg-background/90 shadow-md backdrop-blur-sm" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-extrabold" style={{ color, fontSize: size * 0.25 }}>{percent}%</span>
    </div>
  );
}
