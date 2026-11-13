// app/terms/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms of use for the Seneha matrimony service.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of use", description: "Terms of use for the Seneha matrimony service.", url: "/terms" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
