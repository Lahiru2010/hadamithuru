// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar"; 
import { getNavData } from "@/lib/nav-profile";
import { preload } from "react-dom";
import SiteFooter from "@/components/SiteFooter";
import ImageProtection from "@/components/ImageProtection";
import SessionGuard from "@/components/SessionGuard";
import SupportChat from "@/components/SupportChat";
import FaviconBadge from "@/components/FaviconBadge";
import CookieConsent from "@/components/CookieConsent";
import LiveAlerts from "@/components/LiveAlerts";
import ReferralCapture from "@/components/ReferralCapture";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

// 🔎 SEO — Google search results, Facebook / WhatsApp share, browser tab
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME} – Sri Lanka Marriage Proposals` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "Matrimony",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "si_LK",
    alternateLocale: ["en_LK", "ta_LK"],
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  // 👇 Google Search Console එකේ "HTML tag" verification code එක (.env එකේ NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false },
};

// 👇 Google ට site එක ගැන structured data (Organization + WebSite) — search results වල නම / logo හරියට පේන්න
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
      areaServed: { "@type": "Country", name: "Sri Lanka" },
      email: "support@seneha.lk",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: ["Seneha Matrimony", "Seneha Sri Lanka Marriage Proposals", "සෙනෙහ මංගල යෝජනා"],
      inLanguage: ["si", "en", "ta"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 Navbar එකේ නම සහ photo එක server එකෙන්ම ගන්නවා — page එක open වෙනකොටම පේනවා
  const { user, profile } = await getNavData();

  // 👇 Browser එකට page එක ලැබෙන ගමන්ම photo එක download කරන්න පටන් ගන්න කියනවා
  if (profile?.avatar_url) preload(profile.avatar_url, { as: "image", fetchPriority: "high" });

  return (
    <html lang="si" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${cormorant.variable} font-sans antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }} />
        <Providers>
          <ImageProtection />
          <SessionGuard />
          <Navbar initialUser={user} initialProfile={profile} />
          {children}
          <SiteFooter />
          <SupportChat />
          <FaviconBadge />
          <CookieConsent />
          <LiveAlerts />
          <ReferralCapture />
        </Providers>
      </body>
    </html>
  );
}