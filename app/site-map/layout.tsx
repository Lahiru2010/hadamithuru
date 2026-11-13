// app/site-map/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site map",
  description: "All pages on Seneha – Sri Lanka marriage proposals.",
  alternates: { canonical: "/site-map" },
  openGraph: { title: "Site map", description: "All pages on Seneha – Sri Lanka marriage proposals.", url: "/site-map" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
