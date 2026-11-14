// components/HoroscopeShowcase.tsx — Home: 🔮 "කේන්දරය සහ පොරොන්දම් — site එකේම" (marketing section)
// ⚠️ පෙන්නන කේන්දර දෙක නිදර්ශන පමණයි (ඇත්ත කිසිවෙකුගේ නෙවෙයි)
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Lock, Sparkles, Star, X } from "lucide-react";
import { useLang } from "@/components/providers";
import HoroscopeChart from "@/components/HoroscopeChart";

const SAMPLE_A = { lagna: 4, planets: { sun: 8, moon: 2, mars: 6, mercury: 9, jupiter: 0, venus: 7, saturn: 10, rahu: 5, ketu: 11 } };
const SAMPLE_B = { lagna: 1, planets: { sun: 3, moon: 9, mars: 11, mercury: 3, jupiter: 6, venus: 4, saturn: 0, rahu: 2, ketu: 8 } };

export default function HoroscopeShowcase({ loggedIn }: { loggedIn: boolean }) {
  const { t, lang } = useLang();
  const H = t.home;
  const R = t.horo;
  const points = [H.horoP1, H.horoP2, H.horoP3, H.horoP4];
  const rows: [string, boolean][] = [[R.q_nakath, true], [R.q_gana, true], [R.q_yoni, true], [R.q_rasi, false], [R.q_nadi, true], [R.d_kuja, true]];
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#33070F] via-[#6B0B1F] to-[#AD032A] p-8 text-white shadow-2xl shadow-primary/20 md:p-14">
        {/* ✨ පසුබිම: තරු pattern + glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:26px_26px]" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#F05160]/30 blur-3xl" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur"><Sparkles className="h-4 w-4 text-amber-300" /> {H.horoBadge}</span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">{H.horoTitle}</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">{H.horoSub}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {points.map((p) => (
                <li key={p} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 text-sm leading-snug backdrop-blur"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#AD032A]"><Check className="h-4 w-4" /></span> {p}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={loggedIn ? "/horoscope" : "/register"} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[#AD032A] shadow-xl transition hover:-translate-y-0.5">{loggedIn ? R.generate : H.horoCtaGuest} <ArrowRight className="h-5 w-5" /></Link>
              <span className="flex items-center gap-1.5 text-xs text-white/70"><Lock className="h-3.5 w-3.5" /> {R.private}</span>
            </div>
          </div>

          {/* 👇 නිදර්ශන කේන්දර දෙකක් + පොරොන්දම් card එකක් */}
          <div className="relative mx-auto h-[30rem] w-full max-w-lg">
            <div className="absolute left-0 top-0 w-[62%] -rotate-6 rounded-3xl bg-background p-3 shadow-2xl"><HoroscopeChart lagna={SAMPLE_A.lagna} planets={SAMPLE_A.planets} lang={lang} title={R.lagna} /></div>
            <div className="absolute right-0 top-16 w-[62%] rotate-6 rounded-3xl bg-background p-3 shadow-2xl"><HoroscopeChart lagna={SAMPLE_B.lagna} planets={SAMPLE_B.planets} lang={lang} title={R.lagna} /></div>
            {/* 💗 update-56: කේන්දර දෙක මැද logo හදවත — සුදු රවුමක් ඇතුළේ, උඩ පහළ පාවෙනවා */}
            <span className="absolute left-1/2 top-[38%] z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-xl shadow-black/30 ring-4 ring-white/25 motion-safe:animate-[float_3s_ease-in-out_infinite]"><Image src="/logo-mark.svg" alt="" aria-hidden width={36} height={36} className="h-9 w-9" /></span>
            <div className="absolute bottom-0 left-1/2 z-20 w-64 -translate-x-1/2 rounded-2xl bg-white p-4 text-foreground shadow-2xl dark:bg-[#1a0b11]">
              <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">{R.tableTitle} <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-white">85%</span></p>
              <ul className="space-y-1.5 text-sm">
                {rows.map(([k, ok]) => (
                  <li key={k} className="flex items-center justify-between"><span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{k}</span>{ok ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-500" />}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
