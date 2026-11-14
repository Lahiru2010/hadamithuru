// app/robots.ts → /robots.txt  (Google ට කොයි pages බලන්න පුළුවන්ද කියලා)
import type { MetadataRoute } from "next";
import { IS_INDEXABLE, PRIVATE_PATHS, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // 👇 update-47: Staging (develop) site එකේ මුළු site එකම Google ට වහලා
  if (!IS_INDEXABLE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
