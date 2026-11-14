// components/SiteFooter.tsx
// හැම page එකකම යටින් පේන footer එක (Messages page එකේ නම් chat එක screen එක පුරා තියෙන නිසා පේන්නේ නෑ)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Lock, ShieldCheck, EyeOff, MessageCircleHeart } from "lucide-react";
import { useLang } from "@/components/providers";
import { siteLinkGroups } from "@/lib/site-links";

// 🎨 Footer එකේ පෙනුම — light mode එකට විතරයි (dark mode එක හැම වෙලේම පරණ විදිහටම)
//   "wine"    → තද වයින් / maroon පසුබිම + උඩින් theme රතු ඉරක් + රතු accents (default — update-23)
//   "red"     → theme එකේ තද රතු පසුබිම (#D61F55 → #B5123F) + සුදු අකුරු (update-22)
//   "classic" → පරණ විදිහ (ලා රෝස පසුබිම + අඳුරු අකුරු)
// 👉 වෙනස් කරන්න ඕන මේ එක වචනය විතරයි — වෙන මුකුත් වෙනස් කරන්න ඕන නෑ.
const FOOTER_STYLE: "wine" | "red" | "classic" = "wine";

// ⚠️ Tailwind classes සම්පූර්ණ string විදිහටම ලියන්න ඕනේ (කෑලි එකතු කරලා හැදුවොත් Tailwind එකට හම්බ වෙන්නේ නෑ)
const STYLES = {
  classic: {
    footer: "relative z-10 border-t border-border bg-muted/20",
    brand: "text-2xl font-bold text-primary",
    about: "mt-3 max-w-sm text-base leading-relaxed text-muted-foreground",
    trust: "flex items-center gap-2 text-foreground/80",
    trustIcon: "h-4 w-4 shrink-0 text-primary",
    heading: "text-base font-bold text-foreground",
    link: "text-base text-muted-foreground transition hover:text-primary",
    tipBox: "mt-10 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4",
    tipIcon: "mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400",
    tipText: "text-base text-muted-foreground",
    tipTitle: "font-semibold text-foreground",
    bottomBar: "border-t border-border",
    bottomText: "mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row",
    heart: "h-3.5 w-3.5 fill-primary text-primary",
  },
  // 👇 Light mode එකේ රතු — dark: classes වලින් dark mode එක classic විදිහටම තියෙනවා
  //    (bg-[linear-gradient(...)] පාවිච්චි කළේ globals.css එකේ "from-[#D61F55]" fallback එක dark mode එකටත් අල්ලගන්න නිසා)
  red: {
    footer: "relative z-10 border-t border-[#B5123F] bg-[#C8174A] bg-[linear-gradient(135deg,#D61F55_0%,#B5123F_100%)] text-white dark:border-border dark:bg-muted/20 dark:bg-none dark:text-foreground",
    brand: "text-2xl font-bold text-white dark:text-primary",
    about: "mt-3 max-w-sm text-base leading-relaxed text-white/90 dark:text-muted-foreground",
    trust: "flex items-center gap-2 text-white dark:text-foreground/80",
    trustIcon: "h-4 w-4 shrink-0 text-white dark:text-primary",
    heading: "text-base font-bold text-white dark:text-foreground",
    link: "text-base text-white/90 underline-offset-4 transition hover:text-white hover:underline dark:text-muted-foreground dark:hover:text-primary dark:hover:no-underline",
    tipBox: "mt-10 flex items-start gap-3 rounded-2xl border border-white/30 bg-white/10 p-4 dark:border-amber-500/25 dark:bg-amber-500/5",
    tipIcon: "mt-0.5 h-5 w-5 shrink-0 text-amber-200 dark:text-amber-400",
    tipText: "text-base text-white/90 dark:text-muted-foreground",
    tipTitle: "font-semibold text-white dark:text-foreground",
    bottomBar: "border-t border-white/25 dark:border-border",
    bottomText: "mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/90 sm:flex-row dark:text-muted-foreground",
    heart: "h-3.5 w-3.5 fill-white text-white dark:fill-primary dark:text-primary",
  },
  // 👇 තද වයින් පසුබිම — ලොකු රතු ප්‍රදේශයක් නැති නිසා ඇසට මෘදුයි, රතු CTA buttons තවත් කැපී පේනවා
  wine: {
    footer: "relative z-10 border-t border-transparent bg-[#2A0913] bg-[linear-gradient(180deg,#330B18_0%,#22070F_100%)] text-white dark:border-border dark:bg-muted/20 dark:bg-none dark:text-foreground",
    brand: "text-2xl font-bold text-white dark:text-primary",
    about: "mt-3 max-w-sm text-base leading-relaxed text-white/75 dark:text-muted-foreground",
    trust: "flex items-center gap-2 text-white/90 dark:text-foreground/80",
    trustIcon: "h-4 w-4 shrink-0 text-[#FF6F8E] dark:text-primary",
    heading: "text-base font-bold text-white dark:text-foreground",
    link: "text-base text-white/70 transition hover:text-[#FF8FA8] dark:text-muted-foreground dark:hover:text-primary",
    tipBox: "mt-10 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 dark:border-amber-500/25 dark:bg-amber-500/5",
    tipIcon: "mt-0.5 h-5 w-5 shrink-0 text-amber-300 dark:text-amber-400",
    tipText: "text-base text-white/75 dark:text-muted-foreground",
    tipTitle: "font-semibold text-white dark:text-foreground",
    bottomBar: "border-t border-white/10 dark:border-border",
    bottomText: "mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/60 sm:flex-row dark:text-muted-foreground",
    heart: "h-3.5 w-3.5 fill-[#FF6F8E] text-[#FF6F8E] dark:fill-primary dark:text-primary",
  },
} as const;

export default function SiteFooter() {
  const S = STYLES[FOOTER_STYLE];
  const { t } = useLang();
  const pathname = usePathname();
  const F = t.siteFooter;

  // Messages page එකේ chat එක screen එක පුරා තියෙන නිසා footer එක එපා (නැත්නම් chat එක උඩින් පේනවා)
  if (pathname?.startsWith("/chat")) return null;
  const H = t.home;

  // 🗺️ Footer එකේ links = site map එක (lib/site-links.ts — /site-map page එකත් ඒකමයි)
  const columns = siteLinkGroups(t);

  return (
    <footer className={S.footer}>
      {/* 👇 Wine style එකේ උඩින් theme රතු ඉර (dark mode එකේ නෑ) */}
      {FOOTER_STYLE === "wine" && <div aria-hidden className="h-1 w-full bg-[linear-gradient(90deg,#B5123F,#D61F55_40%,#F0544F)] dark:hidden" />}
      <div className="mx-auto max-w-[1600px] px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + trust */}
          <div>
            <Link href="/" className={S.brand}>{t.brand}</Link>
            <p className={S.about}>{F.about}</p>
            <ul className="mt-5 space-y-2 text-base">
              {[
                { icon: EyeOff, text: H.trust1 },
                { icon: Lock, text: H.trust2 },
                { icon: MessageCircleHeart, text: H.trust3 },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className={S.trust}>
                  <Icon className={S.trustIcon} /> {text}
                </li>
              ))}
            </ul>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className={S.heading}>{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={S.link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Safety tip */}
        <div className={S.tipBox}>
          <ShieldCheck className={S.tipIcon} />
          <p className={S.tipText}>
            <span className={S.tipTitle}>{F.tipTitle}:</span> {F.tip}{" "}
            <Link href="/safety" className={`${S.tipTitle} whitespace-nowrap underline underline-offset-4`}>{t.safety.navLabel} →</Link>
          </p>
        </div>


      </div>
      {/* 👇 Copyright කොටස — උඩ ඉර window එකේ කෙළවරේ ඉඳන් කෙළවරටම */}
      <div className={S.bottomBar}>
        <div className={S.bottomText}>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} Hadamithuru.lk. {t.footer}</span>
            <Link href="/site-map" className="underline-offset-4 hover:underline">{F.siteMap}</Link>
          </p>
          <p className="flex items-center gap-1">{F.madeIn.replace("❤️", "")} <Heart className={S.heart} /></p>
        </div>
      </div>
    </footer>
  );
}
