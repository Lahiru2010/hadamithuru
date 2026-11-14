// app/contact/layout.tsx — 🔎 අප අමතන්න page එකේ SEO (update-59)
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact us",
  description: "Contact the Hadamithuru team – questions about your account, plans, safety or feedback. අප අමතන්න.",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
