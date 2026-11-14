// components/SiteFooter.tsx
// හැම page එකකම යටින් පේන footer එක (Messages page එකේ නම් chat එක screen එක පුරා තියෙන නිසා පේන්නේ නෑ)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Lock, ShieldCheck, EyeOff, MessageCircleHeart } from "lucide-react";
import { useLang } from "@/components/providers";
import { siteLinkGroups } from "@/lib/site-links";
import { SOCIAL_LINKS } from "@/lib/site";
import BrandLogo from "@/components/BrandLogo";

// 📱 update-47: Social media icons (lucide එකේ brand icons නැති නිසා SVG කෙලින්ම)
function SocialIcon({ name }: { name: (typeof SOCIAL_LINKS)[number]["key"] }) {
  const common = { className: "h-[18px] w-[18px]", viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (name) {
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
  }
}

// 🎨 Footer එකේ පෙනුම — light mode එකට විතරයි (dark mode එක හැම වෙලේම පරණ විදිහටම)
//   "wine"    → තද වයින් / maroon පසුබිම + උඩින් theme රතු ඉරක් + රතු accents (default — update-23)
//   "red"     → theme එකේ තද රතු පසුබිම (#D52047 → #AD032A) + සුදු අකුරු (update-22)
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
    social: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-white",
  },
  // 👇 Light mode එකේ රතු — dark: classes වලින් dark mode එක classic විදිහටම තියෙනවා
  //    (bg-[linear-gradient(...)] පාවිච්චි කළේ globals.css එකේ "from-[#D52047]" fallback එක dark mode එකටත් අල්ලගන්න නිසා)
  red: {
    footer: "relative z-10 border-t border-[#AD032A] bg-[#C1122F] bg-[linear-gradient(135deg,#D52047_0%,#AD032A_100%)] text-white dark:border-border dark:bg-muted/20 dark:bg-none dark:text-foreground",
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
    social: "flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-[#AD032A] dark:bg-primary/10 dark:text-primary dark:hover:bg-primary dark:hover:text-white",
  },
  // 👇 තද වයින් පසුබිම — ලොකු රතු ප්‍රදේශයක් නැති නිසා ඇසට මෘදුයි, රතු CTA buttons තවත් කැපී පේනවා
  wine: {
    footer: "relative z-10 border-t border-transparent bg-[#2B060E] bg-[linear-gradient(180deg,#33070F_0%,#220409_100%)] text-white dark:border-border dark:bg-muted/20 dark:bg-none dark:text-foreground",
    brand: "text-2xl font-bold text-white dark:text-primary",
    about: "mt-3 max-w-sm text-base leading-relaxed text-white/75 dark:text-muted-foreground",
    trust: "flex items-center gap-2 text-white/90 dark:text-foreground/80",
    trustIcon: "h-4 w-4 shrink-0 text-[#FE6A6C] dark:text-primary",
    heading: "text-base font-bold text-white dark:text-foreground",
    link: "text-base text-white/70 transition hover:text-[#FF8A8C] dark:text-muted-foreground dark:hover:text-primary",
    tipBox: "mt-10 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 dark:border-amber-500/25 dark:bg-amber-500/5",
    tipIcon: "mt-0.5 h-5 w-5 shrink-0 text-amber-300 dark:text-amber-400",
    tipText: "text-base text-white/75 dark:text-muted-foreground",
    tipTitle: "font-semibold text-white dark:text-foreground",
    bottomBar: "border-t border-white/10 dark:border-border",
    bottomText: "mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/60 sm:flex-row dark:text-muted-foreground",
    heart: "h-3.5 w-3.5 fill-[#FE6A6C] text-[#FE6A6C] dark:fill-primary dark:text-primary",
    social: "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#D52047] hover:text-white dark:bg-primary/10 dark:text-primary dark:hover:bg-primary dark:hover:text-white",
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
      {FOOTER_STYLE === "wine" && <div aria-hidden className="h-1 w-full bg-[linear-gradient(90deg,#AD032A,#D52047_40%,#F05160)] dark:hidden" />}
      <div className="mx-auto max-w-[1600px] px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + trust */}
          <div>
            {/* 💗 update-48: logo එක — තද පසුබිමේ (wine / red) සුදු අකුරු */}
            <Link href="/" aria-label={t.brand} className="inline-flex">
              <BrandLogo height={32} variant={FOOTER_STYLE === "classic" ? "auto" : "white"} className="h-8 w-auto" />
            </Link>
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

            {/* 📱 update-47: Social media links (lib/site.ts එකේ SOCIAL_LINKS — url එක "" නම් ඒ icon එක පේන්නේ නෑ) */}
            {SOCIAL_LINKS.some((l) => l.url) && (
              <div className="mt-6">
                <p className={S.heading}>{F.followUs}</p>
                <ul className="mt-3 flex flex-wrap gap-2.5">
                  {SOCIAL_LINKS.filter((l) => l.url).map((l) => (
                    <li key={l.key}>
                      <a href={l.url} target="_blank" rel="noopener noreferrer me" aria-label={`${l.label} – Hadamithuru`} title={l.label} className={S.social}>
                        <SocialIcon name={l.key} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
