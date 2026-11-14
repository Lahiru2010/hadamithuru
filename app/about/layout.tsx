// app/about/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About us – Safe matrimony for Sri Lankan families",
  description: "Learn how Hadamithuru (හදමිතුරු) helps Sri Lankan singles and families find a life partner safely – verified profiles, private photos and horoscope matching. අප ගැන.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
