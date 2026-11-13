// app/browse/layout.tsx — 🔒 පෞද්ගලික page එකක් — Google index කරන්නේ නෑ
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse profiles",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
