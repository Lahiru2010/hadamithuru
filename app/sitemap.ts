// app/sitemap.ts → /sitemap.xml  (Google Search Console එකට submit කරන්න)
// 🔒 සාමාජිකයින්ගේ පැතිකඩ මෙතන නෑ — ඒවා පෞද්ගලිකයි (login වෙලා විතරයි)
import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path === "/" ? "" : p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
