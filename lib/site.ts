// lib/site.ts
// 🌐 Site එකේ මූලික විස්තර — SEO (Google), sitemap, Open Graph වලට.
// ⚠️ Live domain එක Vercel / hosting එකේ NEXT_PUBLIC_SITE_URL විදිහට දාන්න (උදා: https://hadamithuru.lk)

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://hadamithuru.lk").replace(/\/+$/, "");
export const SITE_NAME = "Hadamithuru";

// 👇 Google search results වල පේන title / description (English + සිංහල + தமிழ் — ලංකාවේ අය තුන් භාෂාවෙන්ම search කරනවා)
export const SITE_TITLE = "Hadamithuru – Sri Lanka Marriage Proposals | මංගල යෝජනා | திருமண வரன்கள்";
export const SITE_DESCRIPTION =
  "Hadamithuru is a safe, private matrimony site for Sri Lankan families. Find verified Sinhala, Tamil and Muslim marriage proposals, horoscope matching and family-friendly search. " +
  "ශ්‍රී ලාංකික පවුල් සඳහා ආරක්ෂිත මංගල යෝජනා සේවාව — තහවුරු කළ පැතිකඩ, කේන්දර ගැලපීම.";

// 👇 ලංකාවේ අය search කරන වචන (meta keywords එක Google භාවිතා නොකළත් Bing / අනිත් ඒවාට උදව් වෙනවා)
export const SITE_KEYWORDS = [
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
