// app/help/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & safety – Questions about Seneha",
  description: "Answers to common questions about creating a profile, privacy, verification, interests and staying safe on Seneha. උදව් සහ ආරක්ෂාව.",
  alternates: { canonical: "/help" },
  openGraph: { title: "Help & safety – Questions about Seneha", description: "Answers to common questions about creating a profile, privacy, verification, interests and staying safe on Seneha. උදව් සහ ආරක්ෂාව.", url: "/help" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
