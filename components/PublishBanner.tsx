// components/PublishBanner.tsx
// Browse page එකේ උඩ: user ගේ profile එක publish කරලා නැත්නම් ඒක මතක් කරන banner එක
"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { useLang } from "@/components/providers";

export default function PublishBanner() {
  const { t } = useLang();
  const PB = t.publish;
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lock className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{PB.browseBannerTitle}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{PB.browseBannerMsg}</p>
        </div>
      </div>
      <Link
        href="/profile"
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:opacity-90"
      >
        {PB.browseBannerCta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
