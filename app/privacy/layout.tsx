// app/privacy/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Seneha protects your photos, phone number and personal details.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy policy", description: "How Seneha protects your photos, phone number and personal details.", url: "/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
