// app/horoscope/layout.tsx — 🔒 පෞද්ගලික page එකක්
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My horoscope", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
