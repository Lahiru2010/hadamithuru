// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar"; 
import SiteFooter from "@/components/SiteFooter";
import ImageProtection from "@/components/ImageProtection";
import SessionGuard from "@/components/SessionGuard";
import SupportChat from "@/components/SupportChat";
import FaviconBadge from "@/components/FaviconBadge";
import CookieConsent from "@/components/CookieConsent";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import OnboardingTour from "@/components/OnboardingTour";
import ReferralCapture from "@/components/ReferralCapture";
import { IS_INDEXABLE, SITE_ALT_NAMES, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL, SOCIAL_URLS } from "@/lib/site";

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
  // 👇 update-47: "%s | Hadamithuru" — කලින් "… – Sri Lanka marriage proposals | Hadamithuru – Sri Lanka Marriage Proposals" වගේ දෙපාරක් ආවා
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
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
  // 👇 update-47: Staging (develop) එකේ noindex — Live (main) එකේ විතරක් Google search එකට
  robots: IS_INDEXABLE
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false },
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
      logo: `${SITE_URL}/icon-512.png`, // 👈 update-48: අලුත් හදවත logo එක
      image: `${SITE_URL}/logo.svg`,
      areaServed: { "@type": "Country", name: "Sri Lanka" },
      email: "support@hadamithuru.lk",
      alternateName: SITE_ALT_NAMES,
      description: SITE_DESCRIPTION,
      // 👇 update-47: Social media pages — Google search එකේ brand panel එකට
      ...(SOCIAL_URLS.length ? { sameAs: SOCIAL_URLS } : {}),
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "support@hadamithuru.lk", url: `${SITE_URL}/contact`, areaServed: "LK", availableLanguage: ["Sinhala", "English", "Tamil"], hoursAvailable: "Mo-Su 00:00-23:59" }, // 👈 update-65: 24/7 + contact page
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      alternateName: [...SITE_ALT_NAMES, "Hadamithuru Sri Lanka Marriage Proposals", "හදමිතුරු මංගල යෝජනා"],
      inLanguage: ["si", "en", "ta"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ⚡ update-42: Navbar එකේ user / photo එක server එකෙන් ගන්නේ නෑ (browser එකේදී).
  //    එතකොට Home, About, Help, Safety වගේ public pages "static" වෙනවා — Vercel CDN එකෙන් ක්ෂණිකව එනවා
  //    (කලින් හැම page එකකටම server එකෙන් Supabase එකට ගිහින් එනකම් බලන් හිටියා).

  return (
    <html lang="si" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${cormorant.variable} font-sans antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }} />
        <Providers>
          <ImageProtection />
          <SessionGuard />
          <Navbar />
          {children}
          <SiteFooter />
          <SupportChat />
          <FaviconBadge />
          <CookieConsent />
          <GoogleAnalytics /> {/* 📊 update-65: NEXT_PUBLIC_GA_ID + cookie consent */}
          <OnboardingTour />
          <ReferralCapture />
        </Providers>
      </body>
    </html>
  );
}