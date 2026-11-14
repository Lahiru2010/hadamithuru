// app/privacy/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy policy",
  description: "How Hadamithuru protects your photos, phone number and personal details. පෞද්ගලිකත්ව ප්‍රතිපත්තිය.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
