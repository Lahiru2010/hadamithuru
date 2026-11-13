// components/VerifyOfferCard.tsx — 🎁 "තහවුරු වෙන්න — Premium නොමිලේ" offer එක (verify page / pricing page)
// Founding ස්ථාන ඉතුරු නම් ඒක (ඇත්ත ඉතුරු ගණනත් එක්ක), නැත්නම් "මාසයක් නොමිලේ".
"use client";

import Link from "next/link";
import { ArrowRight, Crown, Gift } from "lucide-react";
import { useLang } from "@/components/providers";
import { FOUNDING_LIMIT, FOUNDING_MONTHS, OFFER_ACTIVE, useFoundingSpotsLeft } from "@/lib/offer";

export default function VerifyOfferCard({ showCta = false, className = "" }: { showCta?: boolean; className?: string }) {
  const { t } = useLang();
  const O = t.offer;
  const spots = useFoundingSpotsLeft();
  const founding = spots === null || spots > 0; // 👈 DB එකෙන් ගණන එනකම් Founding offer එක පෙන්නනවා
  if (!OFFER_ACTIVE(spots)) return null; // 👈 Founding ස්ථාන ඉවර වුණාම (සහ වෙන තෑග්ගක් නැත්නම්) offer එකම පෙන්නන්නේ නෑ
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-amber-400/40 bg-gradient-to-br from-amber-50 via-background to-rose-50 p-6 shadow-sm dark:from-amber-950/30 dark:to-rose-950/20 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30">
          {founding ? <Crown className="h-7 w-7" /> : <Gift className="h-7 w-7" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-foreground">🎁 {O.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {founding ? O.founding.replace("{limit}", String(FOUNDING_LIMIT)).replace("{months}", String(FOUNDING_MONTHS)) : O.verifyReward}
          </p>
          {founding && spots !== null && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Crown className="h-3.5 w-3.5" /> {O.spotsLeft.replace("{n}", String(spots))}
            </span>
          )}
        </div>
        {showCta && (
          <Link href="/verify" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5">
            {O.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
