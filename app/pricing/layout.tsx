// app/pricing/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/pricing",
  title: "Plans & pricing",
  description: "Hadamithuru membership plans for Sri Lankan marriage proposals. Start free and upgrade when you are ready. පැකේජ සහ මිල.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
