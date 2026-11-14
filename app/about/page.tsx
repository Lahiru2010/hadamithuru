// app/about/page.tsx
// අප ගැන — අලුත් අයට site එක ගැන (අරමුණ, කාටද, වටිනාකම්, පෞද්ගලිකත්වය, නියමයන්, සම්බන්ධ වෙන්න)
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Lock, Mail, MessageCircleHeart, ScrollText, ShieldCheck, Globe2 } from "lucide-react";
import { useLang } from "@/components/providers";
import { useLoggedIn } from "@/lib/useLoggedIn";

export default function AboutPage() {
  const { t } = useLang();
  const A = t.aboutPage;
  const loggedIn = useLoggedIn();
  const brand = (x: string) => x.replaceAll("{brand}", t.brand);

  const values = [
    { icon: Lock, title: A.v1t, desc: A.v1d },
    { icon: MessageCircleHeart, title: A.v2t, desc: A.v2d },
    { icon: Globe2, title: A.v3t, desc: A.v3d },
  ];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full pointer-events-none blur-[140px] bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20">
        {/* Hero */}
        <header className="text-center">
          {/* 💗 update-56: "Hadamithuru ගැන" උඩින් logo හදවත */}
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/15"><Image src="/logo-mark.svg" alt="" aria-hidden width={48} height={48} priority className="h-12 w-12" /></span>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{brand(A.title)}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{A.subtitle}</p>
        </header>

        {/* Mission + who */}
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-border/60 bg-background/70 p-8 shadow-sm backdrop-blur">
            <h2 className="text-2xl font-bold text-foreground">{A.missionTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{brand(A.missionText)}</p>
          </div>
          <div className="rounded-[2rem] border border-border/60 bg-background/70 p-8 shadow-sm backdrop-blur">
            <h2 className="text-2xl font-bold text-foreground">{A.forWhoTitle}</h2>
            <ul className="mt-4 space-y-3">
              {[A.forWho1, A.forWho2, A.forWho3].map((x) => (
                <li key={x} className="flex items-start gap-3 text-muted-foreground"><Check className="mt-0.5 h-5 w-5 shrink-0 text-green-500" /> {x}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Values */}
        <section className="mt-16">
          <h2 className="text-center text-3xl font-bold text-foreground">{A.valuesTitle}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-[2rem] border border-border/60 bg-background p-7 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><v.icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy / Terms / Contact (footer links මෙතනට එනවා) */}
        <section className="mt-16 space-y-6">
          <div id="privacy" className="scroll-mt-28 rounded-[2rem] border border-border/60 bg-background p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><ShieldCheck className="h-5 w-5 text-primary" /> {A.privacyTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{A.privacyText}</p>
          </div>
          <div id="terms" className="scroll-mt-28 rounded-[2rem] border border-border/60 bg-background p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><ScrollText className="h-5 w-5 text-primary" /> {A.termsTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{A.termsText}</p>
          </div>
          <div id="contact" className="scroll-mt-28 rounded-[2rem] border border-border/60 bg-background p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><Mail className="h-5 w-5 text-primary" /> {A.contactTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{A.contactText}</p>
            {/* ⚠️ ඔයාගේ ඇත්ත email එක lib/i18n.ts → aboutPage.contactEmail එකේ දාන්න */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              {/* 📮 update-59: Contact form page එකට */}
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-5 py-2.5 font-semibold text-white shadow-md shadow-primary/20 transition hover:opacity-90">{t.contactPage.send} <ArrowRight className="h-4 w-4" /></Link>
              <a href={`mailto:${A.contactEmail}`} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">{A.contactEmail}</a>
            </div>
          </div>
        </section>

        {/* CTA — login නැති අයට විතරයි (login වුණ අයට "පටන් ගන්න සූදානම්ද?" ඕන නෑ) */}
        {loggedIn === false && <section className="mt-16 rounded-[2.5rem] bg-gradient-to-r from-[#D52047] to-[#F05160] p-10 text-center text-white shadow-2xl shadow-primary/20">
          <h2 className="text-3xl font-extrabold">{A.ctaTitle}</h2>
          <Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#AD032A] shadow-lg transition hover:-translate-y-0.5">
            {A.ctaButton} <ArrowRight className="h-5 w-5" />
          </Link>
        </section>}
      </div>
    </main>
  );
}
