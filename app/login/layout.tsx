// app/login/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/login",
  title: "Log in",
  description: "Log in to your Hadamithuru account to see your matches, interests and messages. හදමිතුරු ගිණුමට පිවිසෙන්න.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
