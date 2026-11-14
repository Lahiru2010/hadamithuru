// components/CookieConsent.tsx — 🍪 Cookie දැනුම්දීම (පහළ දකුණු පැත්තේ, 🎧 support බොත්තමට උඩින් — ඒක වහන්නේ නෑ)
// එක පාරක් තේරුවම ආයේ පේන්නේ නෑ (lib/consent.ts). Admin pages වල පෙන්නන්නේ නෑ.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";
import { useLang } from "@/components/providers";
import { readConsent, saveConsent } from "@/lib/consent";

export default function CookieConsent() {
  const { t } = useLang();
  const C = t.cookies;
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  // 👇 Page එක load වෙලා ටිකකට පස්සේ (පළමු පෙනුමට බාධා නොවෙන්න) — කලින් තේරුවා නම් පෙන්නන්නේ නෑ
  useEffect(() => {
    const id = setTimeout(() => setShow(!readConsent()), 1200);
    return () => clearTimeout(id);
  }, []);

  if (!show || pathname?.startsWith("/admin")) return null;

  const choose = (analytics: boolean) => {
    saveConsent(analytics);
    setShow(false);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label={C.title} className="fixed bottom-24 left-4 right-4 z-[95] sm:left-auto sm:right-5 sm:w-[26rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        {/* ✕ = අත්‍යවශ්‍ය ඒවා පමණක් */}
        {/* 👇 z-10 — කලින් පහළ content එක බොත්තමට උඩින් තිබ්බ නිසා click එක වැටුණේ නෑ */}
        <button type="button" onClick={() => choose(false)} aria-label={C.necessaryOnly} className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="relative flex gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md shadow-amber-500/30">
            <Cookie className="h-6 w-6" />
          </span>
          <div className="min-w-0 pr-5">
            <p className="font-bold text-foreground">{C.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {C.text}{" "}
              <Link href="/privacy#cookies" className="font-semibold text-primary underline-offset-4 hover:underline">{C.learnMore}</Link>
            </p>
          </div>
        </div>
        <div className="relative mt-4 flex gap-2">
          <button type="button" onClick={() => choose(false)} className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary">
            {C.necessaryOnly}
          </button>
          <button type="button" onClick={() => choose(true)} className="flex-1 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:opacity-90">
            {C.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
