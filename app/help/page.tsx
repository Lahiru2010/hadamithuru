// app/help/page.tsx
// උදව් සහ සහාය — මාතෘකා අනුව FAQ, සහාය email එක, ආරක්ෂක ගැටලු වාර්තා කරන්න
"use client";

import { useState } from "react";
import { ChevronDown, LifeBuoy, Mail, ShieldAlert, UserRound, Image as ImageIcon, HeartHandshake, Lock } from "lucide-react";
import { useLang } from "@/components/providers";

export default function HelpPage() {
  const { t } = useLang();
  const H = t.help;
  const email = t.aboutPage.contactEmail; // ⚠️ ඇත්ත email එක lib/i18n.ts → aboutPage.contactEmail

  const cats = [
    { id: "account", icon: UserRound, label: H.catAccount, qa: [[H.q1, H.a1], [H.q2, H.a2]] },
    { id: "profile", icon: ImageIcon, label: H.catProfile, qa: [[H.q3, H.a3], [H.q4, H.a4]] },
    { id: "matches", icon: HeartHandshake, label: H.catMatches, qa: [[H.q5, H.a5], [H.q6, H.a6]] },
    { id: "safety", icon: Lock, label: H.catSafety, qa: [[H.q7, H.a7], [H.q8, H.a8]] },
  ];
  const [active, setActive] = useState("account");
  const current = cats.find((c) => c.id === active)!;

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full pointer-events-none blur-[140px] bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16">
        <header className="text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LifeBuoy className="h-8 w-8" /></span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground">{H.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">{H.subtitle}</p>
        </header>

        {/* මාතෘකා */}
        <div role="tablist" aria-label={H.searchHint} className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cats.map((c) => {
            const on = c.id === active;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(c.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition ${on ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
              >
                <c.icon className="h-6 w-6" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* ප්‍රශ්න */}
        <div key={active} className="mt-6 space-y-3 animate-in fade-in duration-300">
          {current.qa.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-border bg-background p-5 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                {q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>

        {/* සම්බන්ධ වෙන්න + වාර්තා කරන්න */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-border/60 bg-background p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><Mail className="h-5 w-5 text-primary" /> {H.contactTitle}</h2>
            <p className="mt-2 text-muted-foreground">{H.contactText}</p>
            <a href={`mailto:${email}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-5 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90">
              <Mail className="h-4 w-4" /> {H.emailUs}
            </a>
            <p className="mt-3 text-sm text-muted-foreground">{email}</p>
          </div>
          <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/5 p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" /> {H.reportTitle}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{H.reportText}</p>
            <a href={`mailto:${email}?subject=Safety%20report`} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 px-5 py-3 font-semibold text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" /> {H.reportTitle}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
