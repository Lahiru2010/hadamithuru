// components/VerifiedShowcase.tsx — Home page: ✅ "තහවුරු කළ සාමාජිකයින්" concept එක
// update-26: තද නිල් premium card එකක් — වම් පැත්තේ පියවර 3 (timeline), දකුණු පැත්තේ නිල් ලකුණ තියෙන sample cards 3ක් (fan එකක් වගේ)
// ⚠️ Sample cards ඇත්ත සාමාජිකයින් නෙවෙයි — නිල් ලකුණ පේන විදිහ පෙන්නන්න විතරයි (photos නෑ, අකුරු විතරයි)
"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Crown, FileBadge, Lock, ScanFace, ShieldCheck } from "lucide-react";
import { FOUNDING_LIMIT, FOUNDING_MONTHS, OFFER_ACTIVE, useFoundingSpotsLeft } from "@/lib/offer";
import { useLang } from "@/components/providers";
import VerifiedBadge from "@/components/VerifiedBadge";

const CARD_STYLES = [
  { pos: "left-0 top-16 -rotate-[8deg]", grad: "from-amber-200 via-rose-200 to-rose-300" },
  { pos: "right-0 top-12 rotate-[7deg]", grad: "from-sky-200 via-indigo-200 to-violet-300" },
  { pos: "left-1/2 top-0 -translate-x-1/2 z-10", grad: "from-rose-200 via-rose-300 to-[#F0544F]" },
];

export default function VerifiedShowcase({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useLang();
  const H = t.home;
  const samples = H.verSamples.split("|");
  const O = t.offer;
  const spots = useFoundingSpotsLeft();
  const spotsOk = spots === null || spots > 0;
  const steps = [
    { icon: FileBadge, title: H.ver1t, desc: H.ver1d },
    { icon: ScanFace, title: H.ver2t, desc: H.ver2d },
    { icon: BadgeCheck, title: H.ver3t, desc: H.ver3d },
  ];

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-20">
      {/* 👇 update-38: box එකක් නැතුව (උඩ කේන්දර section එක box එකක් නිසා — page එකේ රිද්මයට) */}
      <div className="relative px-2 py-6 text-foreground md:px-6">
        <div aria-hidden className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#1D9BF0]/10 blur-3xl" />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
          {/* වම: කතාව + පියවර */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#1D9BF0]/30 bg-[#1D9BF0]/10 px-4 py-1.5 text-sm font-semibold text-[#1569B5] dark:text-[#7CC4FA]">
              <BadgeCheck className="h-4 w-4 fill-[#1D9BF0] text-white" /> {H.verEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">{H.verTitle}</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">{H.verSubtitle}</p>
            {/* 🎁 Offer එක (ස්ථාන ඉවර වුණාම පේන්නේ නෑ) */}
            {OFFER_ACTIVE(spots) && <p className="mt-5 inline-flex max-w-xl items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:text-amber-200">
              <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                {spotsOk ? O.founding.replace("{limit}", String(FOUNDING_LIMIT)).replace("{months}", String(FOUNDING_MONTHS)) : O.verifyReward}
                {spotsOk && spots !== null && <span className="ml-1 text-amber-600 dark:text-amber-300">· {O.spotsLeft.replace("{n}", String(spots))}</span>}
              </span>
            </p>}

            {/* 👇 පියවර 3 — ඉරකින් සම්බන්ධ කරපු timeline එකක් */}
            <ol className="relative mt-10 grid gap-4 sm:grid-cols-3">
              <span aria-hidden className="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-[#1D9BF0]/10 via-[#1D9BF0]/40 to-[#1D9BF0]/10 sm:block" />
              {steps.map(({ icon: Icon, title, desc }, i) => (
                <li key={title} className="relative">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D9BF0] text-white shadow-lg shadow-blue-500/25">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold text-[#1D9BF0] ring-2 ring-[#1D9BF0]">{i + 1}</span>
                  </span>
                  <h3 className="mt-4 font-bold leading-snug">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href={loggedIn ? "/verify" : "/register"} className="inline-flex items-center gap-2 rounded-full bg-[#1D9BF0] px-7 py-3.5 font-bold text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-[#1A8CD8]">
                {loggedIn ? H.verCta : H.verCtaGuest} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/safety" className="inline-flex items-center gap-2 rounded-full px-4 py-3 font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                <ShieldCheck className="h-5 w-5" /> {H.verSafety}
              </Link>
            </div>
          </div>

          {/* දකුණ: sample cards 3ක් fan එකක් වගේ + floating chips */}
          <div className="relative mx-auto h-[25rem] w-full max-w-md" aria-hidden>
            {CARD_STYLES.map((c, i) => {
              const [name, ...rest] = (samples[i] ?? samples[0]).split(" · ");
              const front = i === 2;
              return (
                <div key={i} className={`absolute w-56 overflow-hidden rounded-3xl bg-white text-foreground shadow-2xl transition-transform duration-500 hover:-translate-y-2 dark:bg-[#111a2e] ${c.pos} ${front ? "w-60" : "opacity-90"}`}>
                  <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${c.grad}`}>
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-4xl font-extrabold text-[#B5123F] shadow-inner">{name.charAt(0)}</span>
                    <VerifiedBadge variant="pill" className="absolute bottom-2.5 left-2.5" />
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1.5 text-lg font-bold text-[#0B1A33] dark:text-white">{name} <VerifiedBadge /></p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{rest.join(" · ")}</p>
                  </div>
                </div>
              );
            })}
            <span className="absolute -left-2 bottom-10 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0E3470] shadow-xl motion-safe:animate-[float_6s_ease-in-out_infinite]">
              <ScanFace className="h-4 w-4 text-[#1D9BF0]" /> {H.verChip1}
            </span>
            <span className="absolute -right-2 bottom-24 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0E3470] shadow-xl motion-safe:animate-[float_7s_ease-in-out_infinite_1s]">
              <Lock className="h-4 w-4 text-[#D61F55]" /> {H.verChip2}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
