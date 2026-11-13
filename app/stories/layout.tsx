// app/stories/layout.tsx — 🔒 කතාවක් එවන්න login ඕනේ
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Share your story", robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
