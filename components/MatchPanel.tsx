// components/MatchPanel.tsx
// Profile popup එකේ: ගැලපීමේ ප්‍රතිශතය (රවුම් progress එකක්) + කරුණු අනුව breakdown එක
"use client";

import { HeartHandshake, Info } from "lucide-react";
import { useLang } from "@/components/providers";
import { matchTier, type MatchResult } from "@/lib/match";

const RING = { great: "#16a34a", good: "#D52047", fair: "#9ca3af" };

export default function MatchPanel({ result }: { result: MatchResult }) {
  const { t } = useLang();
  const M = t.match;

  if (!result) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
        <HeartHandshake className="h-5 w-5 shrink-0 text-primary" /> {M.notEnough}
      </div>
    );
  }

  const tier = matchTier(result.percent);
  const r = 34, c = 2 * Math.PI * r;

  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-5">
        {/* රවුම් progress */}
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
            <circle
              cx="40" cy="40" r={r} fill="none" stroke={RING[tier]} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - result.percent / 100)}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">{result.percent}%</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{M.title}</p>
          <p className="text-lg font-bold" style={{ color: RING[tier] }}>{M[tier]}</p>
        </div>
      </div>

      {/* කරුණු අනුව */}
      <ul className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {result.factors.map((f) => {
          const ratio = f.max ? f.score / f.max : 0;
          return (
            <li key={f.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{M[`f_${f.key}` as const]}</span>
                <span className="text-muted-foreground">{Math.round(ratio * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: ratio >= 0.8 ? RING.great : ratio >= 0.5 ? RING.good : RING.fair }} />
              </div>
            </li>
          );
        })}
      </ul>

      <details className="mt-4 text-xs text-muted-foreground">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 font-semibold hover:text-foreground"><Info className="h-3.5 w-3.5" /> {M.how}</summary>
        <p className="mt-2 leading-relaxed">{M.note}</p>
      </details>
    </div>
  );
}
