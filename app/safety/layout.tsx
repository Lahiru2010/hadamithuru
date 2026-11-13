// app/safety/layout.tsx — 🔎 SEO: Safety Center
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Center – Avoid marriage proposal scams",
  description: "How to spot marriage proposal scams in Sri Lanka, meet safely and report a problem on Seneha. ආරක්ෂක මධ්‍යස්ථානය — වංචා හඳුනාගන්න.",
  alternates: { canonical: "/safety" },
  openGraph: { title: "Safety Center – Seneha", description: "How to spot scams, meet safely and report a problem.", url: "/safety" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
