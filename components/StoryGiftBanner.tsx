// components/StoryGiftBanner.tsx — 💍🎁 "ඔබේ ආදර කතාව බෙදාගෙන Hadamithuru තෑග්ගක් ලබාගන්න" (Interests → ගැලපුණු, story page, home)
// ⚠️ තෑග්ග මොකක්ද කියන එක i18n එකේ stories.giftText එකේ — ඔයා දෙන ඇත්ත තෑග්ගට ගැලපෙන්න වෙනස් කරන්න
"use client";

import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { useLang } from "@/components/providers";

export default function StoryGiftBanner({ className = "", showCta = true }: { className?: string; showCta?: boolean }) {
  const { t } = useLang();
  const S = t.stories;
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#D52047] via-[#C1122F] to-[#AD032A] p-5 text-white shadow-lg shadow-primary/20 ${className}`}>
      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">💍</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{S.giftTitle}</p>
          <p className="mt-0.5 text-sm text-white/85">{S.giftText}</p>
        </div>
        {showCta && (
          <Link href="/stories/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#AD032A] shadow-md transition hover:-translate-y-0.5">
            <Gift className="h-4 w-4" /> {S.giftCta} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
