// lib/site.ts
// 🌐 Site එකේ මූලික විස්තර — SEO (Google), sitemap, Open Graph වලට.
// ⚠️ Live domain එක Vercel / hosting එකේ NEXT_PUBLIC_SITE_URL විදිහට දාන්න (උදා: https://hadamithuru.lk)
import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hadamithuru.lk").replace(/\/+$/, "");
export const SITE_NAME = "Hadamithuru";

// 🚫 update-47: Staging / preview (develop branch) site එක Google එකේ index වෙන්න එපා — නැත්නම් එකම site එක දෙපාරක් search එකේ එනවා.
//   Vercel එක "production" (main branch) එකේ විතරයි Google ට index කරන්න දෙන්නේ.
export const IS_INDEXABLE = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
export const SITE_DOMAIN = "hadamithuru.lk";

// 👇 update-47: brand නම මිනිස්සු search කරන වෙනත් විදිහ (ඉඩ තියලා, සිංහලෙන්, .lk එක්ක) — Google ට "මේ ඔක්කොම එකම site එක" කියලා දැනගන්න
export const SITE_ALT_NAMES = ["Hada Mithuru", "Hadamithuru.lk", "හදමිතුරු", "හද මිතුරු", "Hadamithuru Matrimony"];

// 📱 update-47: Social media pages — footer එකේ icons + Google structured data (sameAs)
// ⚠️ ඔයාගේ ඇත්ත page links මෙතන දාන්න. Page එකක් තාම නැත්නම් ඒ පේළියේ url එක "" කරන්න — එතකොට footer එකේ ඒ icon එක පේන්නේ නෑ.
export const SOCIAL_LINKS: { key: "facebook" | "instagram" | "youtube" | "tiktok"; label: string; url: string }[] = [
  { key: "facebook", label: "Facebook", url: "https://www.facebook.com/hadamithuru" },
  { key: "instagram", label: "Instagram", url: "https://www.instagram.com/hadamithuru" },
  { key: "youtube", label: "YouTube", url: "https://www.youtube.com/@hadamithuru" },
  { key: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@hadamithuru" },
];
export const SOCIAL_URLS = SOCIAL_LINKS.map((s) => s.url).filter(Boolean);

// 👇 Google search results වල පේන title / description (English + සිංහල + தமிழ் — ලංකාවේ අය තුන් භාෂාවෙන්ම search කරනවා)
export const SITE_TITLE = "Hadamithuru – Sri Lanka Marriage Proposals | මංගල යෝජනා | திருமண வரன்கள்";
export const SITE_DESCRIPTION =
  "Hadamithuru (හදමිතුරු) is a safe, private matrimony site for Sri Lankan families. Find verified Sinhala, Tamil and Muslim marriage proposals, horoscope matching and family-friendly search. " +
  "ශ්‍රී ලාංකික පවුල් සඳහා ආරක්ෂිත මංගල යෝජනා සේවාව — තහවුරු කළ පැතිකඩ, කේන්දර ගැලපීම.";

// 👇 ලංකාවේ අය search කරන වචන (meta keywords එක Google භාවිතා නොකළත් Bing / අනිත් ඒවාට උදව් වෙනවා)
export const SITE_KEYWORDS = [
  "Hadamithuru", "Hada Mithuru", "hadamithuru.lk", "හදමිතුරු", "හද මිතුරු",
  "Sri Lanka marriage proposals", "Sri Lankan matrimony", "Lanka proposals", "marriage proposals Sri Lanka",
  "Sinhala marriage proposals", "Tamil matrimony Sri Lanka", "Buddhist marriage proposals", "Christian marriage proposals Sri Lanka",
  "Muslim marriage proposals Sri Lanka", "horoscope matching Sri Lanka", "Sri Lankan brides", "Sri Lankan grooms",
  "මංගල යෝජනා", "විවාහ යෝජනා", "මනාලියන්", "මනාලයන්", "කේන්දර ගැලපීම", "திருமண வரன்", "இலங்கை திருமணம்",
];

// 👇 Google ට index කරන්න දෙන public pages (sitemap.xml එකට)
export const PUBLIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/register", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/help", priority: 0.7, changeFrequency: "monthly" },
  { path: "/safety", priority: 0.7, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
  { path: "/site-map", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

// 👇 Login වෙලා විතරක් බලන / පෞද්ගලික pages — Google index කරන්නේ නෑ
export const PRIVATE_PATHS = ["/admin", "/api/", "/chat", "/interests", "/profile", "/verify", "/browse", "/auth/", "/reset-password", "/forgot-password", "/blocked"];

// 🔎 update-47: Public page එකක SEO metadata එක හදන helper එක.
//   කලින් page එකක openGraph එක දැම්මම root එකේ siteName / locale නැති වුණා, Twitter (X) card එකේ title එක
//   හැම page එකකම home එකේ title එකමයි පෙන්නුවේ. දැන් හැම public page එකකටම හරි title / description / link.
export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  // 👇 Share කළාම පේන පින්තූරය (app/opengraph-image.tsx) — page එකේ openGraph එක දැම්මම මේක auto එන්නේ නැති නිසා මෙතනින්
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} – Sri Lanka Marriage Proposals` };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "si_LK",
      alternateLocale: ["en_LK", "ta_LK"],
      title: fullTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image.url] },
  };
}
