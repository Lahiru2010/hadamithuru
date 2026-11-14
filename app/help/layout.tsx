// app/help/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
// 👇 update-65: FAQPage structured data — Google search එකේ ප්‍රශ්න / පිළිතුරු කෙලින්ම පේන්න පුළුවන්
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { translations } from "@/lib/i18n";

export const metadata: Metadata = pageMetadata({
  path: "/help",
  title: "Help & FAQ – Questions about Hadamithuru",
  description: "Answers to common questions about creating a profile, privacy, verification, interests and staying safe on Hadamithuru. උදව් සහ නිතර අසන ප්‍රශ්න.",
});

function faqJsonLd() {
  const qa = (h: Record<string, string>) => [1, 2, 3, 4, 5, 6, 7, 8]
    .map((n) => [h[`q${n}`], h[`a${n}`]])
    .filter(([q, a]) => q && a)
    .map(([q, a]) => ({ "@type": "Question", name: q.replace(/\{brand\}/g, "Hadamithuru"), acceptedAnswer: { "@type": "Answer", text: a.replace(/\{brand\}/g, "Hadamithuru") } }));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [...qa(translations.si.help as unknown as Record<string, string>), ...qa(translations.en.help as unknown as Record<string, string>)],
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()).replace(/</g, "\\u003c") }} />
      {children}
    </>
  );
}
