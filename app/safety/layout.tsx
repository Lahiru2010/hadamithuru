// app/safety/layout.tsx — 🔎 SEO: Safety Center
// 👇 update-47: lib/site.ts එකේ pageMetadata() — Google / Facebook / WhatsApp / X වලට එකම හරි title / description
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/safety",
  title: "Safety Center – Avoid marriage proposal scams",
  description: "How to spot marriage proposal scams in Sri Lanka, meet safely and report a problem on Hadamithuru. ආරක්ෂක මධ්‍යස්ථානය — වංචා හඳුනාගන්න.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
