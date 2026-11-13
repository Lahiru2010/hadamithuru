// components/BoostProgress.tsx — ⚡ Boost එක කොච්චර ගියාද / ඉවර වෙන්න කොච්චර තියෙනවද (progress bar)
//   දින 2කට අඩු → කහ, පැය 24කට අඩු → රතු "ඉක්මනින් ඉවර වෙනවා"
"use client";

import { useLang } from "@/components/providers";

export function boostTimeLeft(until: string) {
  const ms = Date.parse(until) - Date.now();
  return { ms, days: Math.floor(ms / 86400_000), hours: Math.floor((ms % 86400_000) / 3600_000) };
}

export default function BoostProgress({ startedAt, until, compact = false }: { startedAt?: string | null; until: string; compact?: boolean }) {
  const { t } = useLang();
  const B = t.boost;
  const end = Date.parse(until);
  const start = startedAt ? Date.parse(startedAt) : end - 7 * 86400_000;
  const total = Math.max(1, end - start);
  const left = boostTimeLeft(until);
  const pctLeft = Math.min(100, Math.max(0, (left.ms / total) * 100));
  const tone = left.ms < 86400_000 ? "red" : left.ms < 2 * 86400_000 ? "amber" : "green";
  const bar = { red: "bg-red-500", amber: "bg-amber-500", green: "bg-green-500" }[tone];
  const text = { red: "text-red-600 dark:text-red-400", amber: "text-amber-700 dark:text-amber-400", green: "text-green-700 dark:text-green-400" }[tone];
  const leftText = left.ms <= 0 ? B.expired : left.days > 0 ? B.leftDays.replace("{d}", String(left.days)).replace("{h}", String(left.hours)) : B.leftHours.replace("{h}", String(Math.max(1, left.hours)));

  return (
    <div className={compact ? "" : "w-full"}>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className={text}>{tone !== "green" && left.ms > 0 ? `⚠️ ${B.expiringSoon} · ` : ""}{leftText}</span>
        <span className="text-muted-foreground">{new Date(until).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pctLeft}%` }} />
      </div>
    </div>
  );
}
