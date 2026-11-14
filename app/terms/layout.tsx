// app/terms/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/terms",
  title: "Terms of use",
  description: "Terms of use for the Hadamithuru matrimony service in Sri Lanka. භාවිත නියමයන්.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
