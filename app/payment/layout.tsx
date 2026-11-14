// app/payment/layout.tsx — 💳 update-67: ගෙවීම් pages search engines වලට පෙන්නන්නේ නෑ
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
