// app/about/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us – Safe matrimony for Sri Lankan families",
  description: "Learn how Seneha helps Sri Lankan singles and families find a life partner safely – verified profiles, private photos and horoscope matching. අප ගැන.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About us – Safe matrimony for Sri Lankan families", description: "Learn how Seneha helps Sri Lankan singles and families find a life partner safely – verified profiles, private photos and horoscope matching. අප ගැන.", url: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
