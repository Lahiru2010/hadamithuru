// app/help/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/help",
  title: "Help & FAQ – Questions about Hadamithuru",
  description: "Answers to common questions about creating a profile, privacy, verification, interests and staying safe on Hadamithuru. උදව් සහ නිතර අසන ප්‍රශ්න.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
