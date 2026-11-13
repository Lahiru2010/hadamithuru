// app/login/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Hadamithuru account to see your matches, interests and messages.",
  alternates: { canonical: "/login" },
  openGraph: { title: "Log in", description: "Log in to your Hadamithuru account to see your matches, interests and messages.", url: "/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
