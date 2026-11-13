// app/page.tsx — Home (server)
// 🔎 SEO: Google ට මේ page එකේ title / description + නිතර අසන ප්‍රශ්න (FAQ) structured data.
// UI එක තියෙන්නේ components/HomePage.tsx එකේ.
import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { translations } from "@/lib/i18n";
import { SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  alternates: { canonical: "/" },
};

export default function Page() {
  // 👇 Page එක මුලින්ම render වෙන්නේ සිංහලෙන් — ඒ නිසා FAQ structured data එකත් සිංහලෙන් (පේන content එකට ගැලපෙන්න)
  const H = translations.si.home;
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: SITE_URL,
    mainEntity: [
      [H.q1, H.a1],
      [H.q2, H.a2],
      [H.q3, H.a3],
      [H.q4, H.a4],
    ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <HomePage />
    </>
  );
}
