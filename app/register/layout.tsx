// app/register/layout.tsx — 🔎 SEO: මේ page එකේ title / description (page එක client component නිසා මෙතනින්)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your free profile – Sri Lanka marriage proposals",
  description: "Create a free Seneha profile in minutes. Private until you publish, verified members, horoscope matching. නොමිලේ පැතිකඩක් සාදන්න.",
  alternates: { canonical: "/register" },
  openGraph: { title: "Create your free profile – Sri Lanka marriage proposals", description: "Create a free Seneha profile in minutes. Private until you publish, verified members, horoscope matching. නොමිලේ පැතිකඩක් සාදන්න.", url: "/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
