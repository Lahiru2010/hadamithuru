// components/GoogleAnalytics.tsx — 📊 update-65: Google Analytics 4
//   • Vercel → Environment Variables → NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX (Production එකට විතරයි දාන්න)
//   • Cookie banner එකේ "සියල්ල පිළිගන්න" තේරුවොත් විතරයි load වෙන්නේ (lib/consent.ts) — "අත්‍යවශ්‍ය ඒවා පමණක්" නම් කිසිවක් නෑ
//   • Admin pages track කරන්නේ නෑ · IP එක anonymize කරනවා
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasAnalyticsConsent, type Consent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
type W = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  // 🍪 Consent එක (මුලින් + පස්සේ banner එකෙන් තේරුවම)
  useEffect(() => {
    setAllowed(hasAnalyticsConsent());
    const on = (e: Event) => setAllowed((e as CustomEvent<Consent>).detail?.analytics === true);
    window.addEventListener("seneha-consent", on);
    return () => window.removeEventListener("seneha-consent", on);
  }, []);

  // 📥 GA script එක එක පාරයි
  useEffect(() => {
    if (!allowed || !GA_ID) return;
    const w = window as W;
    if (w.gtag) return;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() { w.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }, [allowed]);

  // 📄 Page view — හැම page මාරුවකටම (Next.js එකේ page reload නොවෙන නිසා අතින්)
  useEffect(() => {
    if (!allowed || !GA_ID || pathname?.startsWith("/admin")) return;
    const id = setTimeout(() => {
      (window as W).gtag?.("event", "page_view", { page_path: pathname, page_location: window.location.href, page_title: document.title });
    }, 300); // 👈 අලුත් page එකේ title එක එනකම් පොඩ්ඩක්
    return () => clearTimeout(id);
  }, [allowed, pathname]);

  return null;
}
