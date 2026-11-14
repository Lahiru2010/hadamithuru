// components/HomePage.tsx — Home page එකේ UI එක (client). app/page.tsx එකෙන් SEO metadata + structured data එක්ක render කරනවා.
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import CoupleSlider from "@/components/CoupleSlider";
import FallingHearts from "@/components/FallingHearts";
import VerifiedShowcase from "@/components/VerifiedShowcase";
import HoroscopeShowcase from "@/components/HoroscopeShowcase";
import { useLang } from "@/components/providers";
import { ShieldCheck, Lock, EyeOff, MessageCircleHeart, UserPlus, Search, HeartHandshake, ChevronDown, ArrowRight, Headset } from "lucide-react";

export default function HomePage() {
  const { t, lang } = useLang();
  // ✍️ update-49: සිංහලෙන් hero title එක logo එකේ font එකෙන්ම (Tharu Digital) — SVG පින්තූරයක් විදිහට
  //   (public/hero-title-si.svg — එක පේළිය, public/hero-title-si-2line.svg — phone එකට පේළි දෙක)
  //   ⚠️ lib/i18n.ts එකේ hero.title එක වෙනස් කළොත් පින්තූරය නොපෙන්වා සාමාන්‍ය අකුරු පේනවා (SVG එක අලුතෙන් හදන්න ඕනේ)
  const HERO_SI_TITLE = "ඔබේ ජීවිත සහකරු සොයාගන්න";
  const heroFontTitle = lang === "si" && t.hero.title === HERO_SI_TITLE;
  const H = t.home;
  const X = t.extra;

  const steps = [
    { icon: UserPlus, title: H.h1t, desc: H.h1d },
    { icon: Search, title: H.h2t, desc: H.h2d },
    { icon: HeartHandshake, title: H.h3t, desc: H.h3d },
  ];
  // ⚠️ SAMPLE ආදර කතා — site එක launch කරන්න කලින් ඇත්ත යුවළයන්ගේ කතා (ඔවුන්ගේ අවසරය ඇතුව) දාන්න
  const brand = (x: string) => x.replaceAll("{brand}", t.brand); // 👈 site එකේ නම වෙනස් වුණත් auto මාරු වෙනවා
  const sampleStories = [
    { name: H.r1n, place: H.r1p, quote: brand(H.r1q), year: 2025, img: "/images/couples/couple-1.jpg" },
    { name: H.r2n, place: H.r2p, quote: brand(H.r2q), year: 2025, img: "/images/couples/couple-2.jpg" },
    { name: H.r3n, place: H.r3p, quote: brand(H.r3q), year: 2026, img: "/images/couples/couple-3.jpg" },
    { name: H.r4n, place: H.r4p, quote: brand(H.r4q), year: 2024, img: "/images/couples/couple-4.jpg" },
    { name: H.r5n, place: H.r5p, quote: brand(H.r5q), year: 2025, img: "/images/couples/couple-5.jpg" },
    { name: H.r6n, place: H.r6p, quote: brand(H.r6q), year: 2026, img: "/images/couples/couple-6.jpg" },
  ];
  // 💍 Admin approve කරපු ඇත්ත කතා 3ක් හෝ වැඩි නම් ඒවා — නැත්නම් sample කතා
  const [realStories, setRealStories] = useState<typeof sampleStories>([]);
  useEffect(() => {
    fetch("/api/stories").then((r) => (r.ok ? r.json() : null)).then((d) => {
      const list = (d?.stories ?? []) as { names: string; place: string | null; year: number | null; story: string; photo: string | null }[];
      if (list.length >= 1) { // 👈 Admin slider එකේ තියෙන හැම slide එකක්ම (sample ඒවත් DB එකේ) — publish කළ ගමන් පේනවා
        setRealStories(list.map((x, k) => ({ name: x.names, place: x.place ?? "", quote: x.story, year: x.year ?? new Date().getFullYear(), img: x.photo ?? sampleStories[k % sampleStories.length].img })));
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // 👇 Slides 3ට අඩු නම් slider එක හිස් නොපේන්න sample ඒවලින් පුරවනවා
  const stories = realStories.length >= 3 ? realStories : realStories.length ? [...realStories, ...sampleStories].slice(0, 3) : sampleStories;
  // 👇 Login වෙලාද (login වෙලා නම් register / login කොටස් පෙන්නන්නේ නෑ)
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const faqs = [
    { q: H.q1, a: H.a1 },
    { q: H.q2, a: H.a2 },
    { q: H.q3, a: H.a3 },
    { q: H.q4, a: H.a4 },
  ];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* 👇 Background glow — light mode එකේ මෘදු පීච්/රෝස, dark mode එකේ කලින් වගේම */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full pointer-events-none blur-[140px] bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />

      <div className="relative z-10">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-[1600px] px-4 pb-20 text-center">
          {/* 👇 Hero text + couple slider — වැටෙන hearts දෙකටම උඩින් (slider photos වලටත්) */}
          <div className="relative -mx-4 px-4">
          <FallingHearts fall="min(1400px, 160vh)" className="z-30" />
          <div className="relative pt-24 pb-6">
          <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> {H.badge}
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            {heroFontTitle ? (
              <>
                {/* 👇 Google / screen readers වලට ඇත්ත අකුරු (පේන්නේ නෑ) */}
                <span className="sr-only">{t.hero.title}</span>
                <Image src="/hero-title-si.svg" alt="" aria-hidden width={860} height={75} priority className="mx-auto hidden h-auto w-[700px] max-w-full md:block lg:w-[860px]" />
                <Image src="/hero-title-si-2line.svg" alt="" aria-hidden width={340} height={101} priority className="mx-auto h-auto w-full max-w-[340px] md:hidden" />
              </>
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#E3324F] via-[#F0544F] to-[#E3324F]">{t.hero.title}</span>
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground font-medium">{t.hero.subtitle}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* 👇 Login වෙලා නම් register / login වෙනුවට "සොයන්න" + "මගේ පැතිකඩ" */}
            {loggedIn ? (
              <>
                <Link href="/browse" className="rounded-full bg-gradient-to-r from-[#E3324F] to-[#F0544F] px-10 py-4 font-bold text-white hover:opacity-90 shadow-xl shadow-[#E3324F]/20 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2">
                  {H.findMatch} <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/profile" className="rounded-full bg-background border border-border px-10 py-4 font-bold text-foreground hover:bg-muted shadow-sm transition-all w-full sm:w-auto flex items-center justify-center">
                  {t.extra.goProfile}
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="rounded-full bg-gradient-to-r from-[#E3324F] to-[#F0544F] px-10 py-4 font-bold text-white hover:opacity-90 shadow-xl shadow-[#E3324F]/20 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2">
                  {t.hero.cta} <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/login" className="rounded-full bg-background border border-border px-10 py-4 font-bold text-foreground hover:bg-muted shadow-sm transition-all w-full sm:w-auto flex items-center justify-center">
                  {t.nav.login}
                </Link>
              </>
            )}
          </div>
          {/* Trust points */}
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
            {[
              { icon: EyeOff, text: H.trust1 },
              { icon: Lock, text: H.trust2 },
              { icon: MessageCircleHeart, text: H.trust3 },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {text}</li>
            ))}
          </ul>

          </div>
          </div>

          {/* 👇 Couple photos slider + මැද යුවළගේ ආදර කතාව */}
          <div className="mt-16">
            <CoupleSlider stories={stories} marriedLabel={H.married} prevLabel={H.prev} nextLabel={H.next} badge={X.storyBadge} />
            {/* 💍 Hadamithuru හරහා හමුවුණ අයට — ලස්සන ආරාධනා card එකක් */}
            {loggedIn && (
              <Link href="/stories/new" className="group relative z-40 mx-auto mt-10 flex max-w-2xl flex-col items-center gap-4 overflow-hidden rounded-3xl border border-primary/20 bg-background/90 p-5 text-left shadow-lg shadow-primary/10 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-2xl shadow-md">💍</span>
                <span className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="block font-bold text-foreground">{t.stories.homeInviteTitle}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{t.stories.homeInviteText}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition group-hover:gap-2.5">🎁 {t.stories.giftCta} →</span>
              </Link>
            )}
          </div>
          </div>{/* 👆 hearts wrapper එක මෙතනින් ඉවරයි */}


        </section>

        {/* ---------- How it works ---------- (update-37: hero එකට පස්සේම — අලුත් කෙනෙකුට ඕන පළමු දේ) */}
        <section className="mx-auto max-w-[1600px] px-4 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">✨ 1 · 2 · 3</span>
            <h2 className="mt-4 text-3xl font-bold text-foreground md:text-5xl">{H.howTitle}</h2>
          </div>
          {/* 👇 පියවර 3 — ඉරකින් සම්බන්ධ කරපු timeline එකක් (phone එකේ සිරස්ව) */}
          <ol className="relative mx-auto mt-16 grid max-w-6xl gap-10 md:grid-cols-3 md:gap-8">
            <span aria-hidden className="absolute left-[16.6%] right-[16.6%] top-12 hidden h-0.5 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 md:block" />
            {steps.map((s, i) => (
              <li key={s.title} className="group relative flex flex-col items-center text-center">
                <span className="relative flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-xl shadow-primary/25 transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
                  <s.icon className="h-10 w-10" />
                  <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background text-sm font-extrabold text-primary shadow-md ring-2 ring-primary/20">{i + 1}</span>
                </span>
                <h3 className="mt-6 text-xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 🔮 කේන්දරය සහ පොරොන්දම් (site එකේම) ---------- */}
        <HoroscopeShowcase loggedIn={loggedIn} />

        {/* ---------- ✅ තහවුරු කළ සාමාජිකයින් (නිල් ලකුණ) ---------- */}
        <VerifiedShowcase loggedIn={loggedIn} />

        {/* ---------- FAQ — වම් පැත්තේ title + සහාය card එක, දකුණු පැත්තේ ප්‍රශ්න (හිස් ඉඩ නැතුව) ---------- */}
        <section className="mx-auto max-w-[1600px] px-4 pt-20 pb-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight text-foreground">{H.faqTitle}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{X.faqSideText}</p>
              <div className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#D61F55] to-[#F0544F] p-7 text-white shadow-xl shadow-primary/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><Headset className="h-6 w-6" /></span>
                <h3 className="mt-4 text-xl font-bold">{X.faqSideTitle}</h3>
                <p className="mt-1.5 text-white/90">{X.faqSideText}</p>
                <Link href="/help" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-[#B5123F] shadow transition hover:-translate-y-0.5">
                  {X.faqHelp} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={f.q} className="group rounded-2xl border border-border bg-background p-6 shadow-sm transition open:border-primary/30 open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center gap-4 text-lg font-semibold text-foreground">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{f.q}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition group-open:rotate-180 group-open:border-primary group-open:bg-primary group-open:text-white">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="mt-3 pl-[3.25rem] text-base leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA (login වෙලා නැත්නම් විතරයි) ---------- */}
        {!loggedIn && <section className="mx-auto max-w-[1600px] px-4 pb-24">
          <div className="rounded-[2.5rem] bg-gradient-to-r from-[#D61F55] to-[#F0544F] p-10 md:p-14 text-center text-white shadow-2xl shadow-primary/20">
            <h2 className="text-3xl md:text-4xl font-extrabold">{H.ctaTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">{H.ctaText}</p>
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#B5123F] shadow-lg transition hover:-translate-y-0.5">
              {H.ctaButton} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>}
      </div>
    </main>
  );
}
