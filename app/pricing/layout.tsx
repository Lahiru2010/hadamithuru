// app/pricing/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & pricing",
  description: "Hadamithuru membership plans for finding Sri Lankan marriage proposals. Start free and upgrade when you are ready.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Plans & pricing", description: "Hadamithuru membership plans for finding Sri Lankan marriage proposals. Start free and upgrade when you are ready.", url: "/pricing" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
