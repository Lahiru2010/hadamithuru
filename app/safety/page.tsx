// app/safety/page.tsx — 🛡️ ආරක්ෂක මධ්‍යස්ථානය (Safety Center)
// වංචා හඳුනාගන්න හැටි, ආරක්ෂිතව හමුවෙන හැටි, report කරන හැටි, අපේ ප්‍රතිචාර පොරොන්දුව, හදිසි ඇමතුම් අංක.
"use client";

import { AlertTriangle, BadgeCheck, Bell, Clock, EyeOff, Flag, Headset, HeartHandshake, Lock, Mail, MapPin, Phone, ShieldAlert, ShieldCheck, UserX, Users, Video } from "lucide-react";
import { useLang } from "@/components/providers";

// ⚠️ ඇත්තටම පවත්වාගන්න පුළුවන් කාලයක් විතරක් දාන්න (report එකකට පිළිතුරු දෙන උපරිම පැය ගණන)
const RESPONSE_HOURS = 24;

// 🇱🇰 ශ්‍රී ලංකා හදිසි ඇමතුම් අංක (police.lk — 2026)
const EMERGENCY = [
  { key: "e1", num: "119" },
  { key: "e2", num: "109" },
  { key: "e3", num: "1938" },
  { key: "e4", num: "107" },
] as const;

export default function SafetyPage() {
  const { t } = useLang();
  const S = t.safety;
  const email = t.aboutPage.contactEmail;
  const brand = (x: string) => x.replace("{brand}", t.brand);

  const protections = [
    { icon: EyeOff, title: S.p1t, desc: S.p1d },
    { icon: Lock, title: S.p2t, desc: S.p2d },
    { icon: BadgeCheck, title: S.p3t, desc: S.p3d },
    { icon: HeartHandshake, title: S.p4t, desc: S.p4d },
  ];
  const signs = [S.s1, S.s2, S.s3, S.s4, S.s5, S.s6];
  const meet = [
    { icon: MapPin, text: S.m1 },
    { icon: Users, text: S.m2 },
    { icon: Video, text: S.m3 },
    { icon: ShieldCheck, text: S.m4 },
    { icon: HeartHandshake, text: S.m5 },
  ];
  const report = [
    { icon: Flag, text: S.r1 },
    { icon: Headset, text: S.r2 },
    { icon: Mail, text: S.r3.replace("{email}", email) },
    { icon: UserX, text: S.r4 },
  ];
  const promise = [
    { icon: Clock, text: S.pr1.replace("{hours}", String(RESPONSE_HOURS)) },
    { icon: AlertTriangle, text: S.pr2 },
    { icon: ShieldAlert, text: S.pr3 },
    { icon: Bell, text: S.pr4 },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D52047] to-[#AD032A] text-white shadow-lg shadow-primary/25"><ShieldCheck className="h-8 w-8" /></span>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">{S.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{S.subtitle}</p>
        </div>

        {/* අපි ආරක්ෂා කරන හැටි */}
        <h2 className="mb-5 text-2xl font-bold">{brand(S.protectTitle)}</h2>
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {protections.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 rounded-3xl border border-border bg-background p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* වංචා ලකුණු + ආරක්ෂිතව හමුවීම */}
        <div className="mb-12 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-red-500/25 bg-red-500/[0.04] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-700 dark:text-red-400"><AlertTriangle className="h-5 w-5" /> {S.signsTitle}</h2>
            <ul className="space-y-3">
              {signs.map((x) => (
                <li key={x} className="flex gap-3 text-sm leading-relaxed"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" /> {x}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">{S.signsNote}</p>
          </section>
          <section className="rounded-3xl border border-green-500/25 bg-green-500/[0.04] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-green-700 dark:text-green-400"><ShieldCheck className="h-5 w-5" /> {S.meetTitle}</h2>
            <ul className="space-y-3">
              {meet.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm leading-relaxed"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" /> {text}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* Report කරන හැටි + පොරොන්දුව */}
        <div className="mb-12 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Flag className="h-5 w-5 text-primary" /> {S.reportTitle}</h2>
            <ol className="space-y-3">
              {report.map(({ icon: Icon, text }, i) => (
                <li key={text} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <span className="flex items-start gap-2 pt-1"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {text}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-3xl bg-gradient-to-br from-[#D52047] to-[#AD032A] p-6 text-white shadow-xl shadow-primary/20">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><ShieldCheck className="h-5 w-5" /> {S.promiseTitle}</h2>
            <ul className="space-y-3">
              {promise.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm leading-relaxed text-white/95"><Icon className="mt-0.5 h-4 w-4 shrink-0" /> {text}</li>
              ))}
            </ul>
            <a href={`mailto:${email}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#AD032A] shadow-md transition hover:-translate-y-0.5"><Mail className="h-4 w-4" /> {S.contact}</a>
          </section>
        </div>

        {/* හදිසි ඇමතුම් */}
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/[0.06] p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Phone className="h-5 w-5 text-amber-600" /> {S.emergencyTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{S.emergencyText}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EMERGENCY.map(({ key, num }) => (
              <a key={num} href={`tel:${num}`} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm transition hover:border-amber-500/50">
                <span className="text-2xl font-extrabold tabular-nums text-amber-700 dark:text-amber-400">{num}</span>
                <span className="text-sm leading-snug text-muted-foreground">{S[key]}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
