// app/register/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/register",
  title: "Create your free profile – Sri Lanka marriage proposals",
  description: "Create a free Hadamithuru profile in minutes. Private until you publish, verified members, horoscope matching. නොමිලේ පැතිකඩක් සාදන්න.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
