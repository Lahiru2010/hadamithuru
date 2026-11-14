// components/OnboardingTour.tsx — 🧭 අලුත් ගිණුමකට site එකේ කෙටි guide එකක් (spotlight + පියවර)
// • update-64: ඉබේම එන්නේ **අලුතින් ගිණුමක් හැදුවම එක පාරක් විතරයි** (ගිණුම හදලා දින 3ක් ඇතුළත, කලින් බලලා නැත්නම්).
//   "බැලුවා" කියන එක ගිණුමේම (Supabase user_metadata.tour_done) save වෙනවා — වෙන phone / browser එකකින් ආවත් ආයේ එන්නේ නෑ.
// • Profile menu එකේ "Site guide" එකෙන් ඕන වෙලාවක ආයේ බලන්න පුළුවන්
// • ඉලක්ක: navbar එකේ data-tour="..." තියෙන elements. Phone එකේ පේන්නේ නැති ඒවා මැද card එකක් විදිහට
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useVerifiedHint } from "@/lib/verified-hint";

const KEY = (uid: string) => `hm_tour_done_${uid}`;
export const START_TOUR_EVENT = "hm-start-tour";
// 👇 ඉලක්ක: navbar එකේ data-tour="..." — පළමු එක පේන්නේ නැත්නම් (phone එකේ) ඊළඟ එක (උදා: ☰ menu button එක)
type Step = { targets?: string[]; title: string; text: string };
const NEW_ACCOUNT_DAYS = 3; // 👈 ගිණුම හදලා දින කීයක් ඇතුළතද ඉබේම පෙන්නන්නේ

export default function OnboardingTour() {
  const { t } = useLang();
  const T = t.tour;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [uid, setUid] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const verified = useVerifiedHint() === "1"; // ✅ verify වුණ අයට "තහවුරු කරන්න" කියන්නේ නෑ

  const steps: Step[] = [
    { title: T.s0t, text: T.s0d },
    // 🧭 update-68: navbar එකේ වම් සිට දකුණට පිළිවෙළින් (Browse → කැමැත්ත → පණිවිඩ → පැකේජ → 🔔 → භාෂාව → theme → ගිණුම → සහාය)
    { targets: ["browse", "menu"], title: T.s1t, text: T.s1d },
    { targets: ["interests", "menu"], title: T.s2t, text: T.s2d },
    { targets: ["messages", "menu"], title: T.s3t, text: T.s3d },
    { targets: ["pricing", "menu"], title: T.pricingT, text: T.pricingD }, // 👑 update-64
    { targets: ["bell"], title: T.s4t, text: T.s4d },
    { targets: ["lang", "menu"], title: T.langT, text: T.langD },        // 🌐 update-64
    { targets: ["theme", "menu"], title: T.themeT, text: T.themeD },     // 🌙 update-64
    { targets: ["profile", "menu"], title: T.s5t, text: verified ? T.s5dVerified : T.s5d },
    { targets: ["support"], title: T.s6t, text: T.s6d },
    { title: T.s7t, text: verified ? T.s7dVerified : T.s7d },
  ];
  const step = steps[i];

  // 👇 අලුත් ගිණුමකට විතරයි, එක පාරයි (admin / My profile wizard / login / register එකේ නෙවෙයි — wizard එක ඉවර කරලා එළියට ආවම)
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      const id = user?.id ?? null;
      setUid(id);
      if (!id || !user) return;
      let seenHere = false;
      try { seenHere = !!localStorage.getItem(KEY(id)); } catch { /* private mode */ }
      if (seenHere || user.user_metadata?.tour_done) return;                    // 👈 කලින් බැලුවා (මේ browser එකේ හරි ගිණුමේ හරි)
      const created = user.created_at ? new Date(user.created_at).getTime() : 0;
      if (!created || Date.now() - created > NEW_ACCOUNT_DAYS * 86400_000) return; // 👈 පරණ ගිණුම් වලට ඉබේම එන්නේ නෑ
      if (pathname?.startsWith("/admin") || pathname?.startsWith("/profile") || pathname?.startsWith("/login") || pathname?.startsWith("/register")) return;
      setTimeout(() => { setI(0); setOpen(true); }, 1200);
    });
    const start = () => { setI(0); setOpen(true); };
    window.addEventListener(START_TOUR_EVENT, start);
    return () => window.removeEventListener(START_TOUR_EVENT, start);
  }, [pathname]);

  const finish = useCallback(() => {
    setOpen(false);
    if (!uid) return;
    try { localStorage.setItem(KEY(uid), "1"); } catch { /* private mode */ }
    // 👇 ගිණුමේම මතක තියාගන්නවා — ආයේ කවදාවත් ඉබේම එන්නේ නෑ (වෙන device එකකින් ආවත්)
    createClient().auth.updateUser({ data: { tour_done: true } }).catch(() => {});
  }, [uid]);

  // 👇 ඉලක්කය තියෙන තැන (පේන්නේ නැත්නම් null → මැදට)
  useEffect(() => {
    if (!open) return;
    const targets = steps[i]?.targets ?? [];
    const measure = () => {
      // 👇 පේන පළමු ඉලක්කය (desktop එකේ navbar item එක, phone එකේ ☰ menu button එක)
      let found: DOMRect | null = null;
      for (const tg of targets) {
        for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${tg}"]`)) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) { found = r; break; }
        }
        if (found) break;
      }
      setRect(found);
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, finish, steps.length]);

  if (!open || !step) return null;
  const pad = 8;
  const last = i === steps.length - 1;
  // Card එක ඉලක්කයට යටින් (පහළ ඉඩ නැත්නම් උඩින්) — නැත්නම් මැද
  const cardW = 340;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const below = rect ? rect.bottom + 14 + 220 < vh : true;
  const cardStyle: React.CSSProperties = rect
    ? { position: "fixed", width: Math.min(cardW, vw - 24), left: Math.max(12, Math.min(rect.left + rect.width / 2 - cardW / 2, vw - cardW - 12)), ...(below ? { top: rect.bottom + 14 } : { bottom: vh - rect.top + 14 }) }
    : { position: "fixed", width: Math.min(400, vw - 24), left: "50%", top: "50%", transform: "translate(-50%, -50%)" };

  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* 🔦 Spotlight — ඉලක්කය වටේ කවුළුවක්, අනිත් හැම තැනම අඳුරු */}
      {rect ? (
        <div className="pointer-events-none fixed rounded-2xl ring-2 ring-primary transition-all duration-300" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(15, 5, 10, 0.65)" }} />
      ) : (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />
      )}

      <div style={cardStyle} className="rounded-3xl border border-border bg-background p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D52047] to-[#AD032A] text-white">{last ? <BadgeCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</span>
          <button onClick={finish} aria-label={T.skip} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="mt-3 text-lg font-extrabold">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>

        {last && (
          <div className="mt-4 grid gap-2">
            {verified ? (
              <Link href="/browse" onClick={finish} className="rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] py-2.5 text-center text-sm font-bold text-white">{T.ctaBrowse}</Link>
            ) : (
              <>
                <Link href="/profile" onClick={finish} className="rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] py-2.5 text-center text-sm font-bold text-white">{T.ctaProfile}</Link>
                <Link href="/verify" onClick={finish} className="rounded-xl border border-border py-2.5 text-center text-sm font-semibold hover:border-primary/40 hover:text-primary">{T.ctaVerify}</Link>
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          {/* පියවර තිත් */}
          <div className="flex gap-1.5">{steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />)}</div>
          <div className="flex items-center gap-2">
            {i === 0 ? <button onClick={finish} className="px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">{T.skip}</button>
              : <button onClick={() => setI(i - 1)} aria-label={T.back} className="rounded-xl border border-border p-2 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>}
            {last ? <button onClick={finish} className="rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background">{T.done}</button>
              : <button onClick={() => setI(i + 1)} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">{i === 0 ? T.start : T.next} <ArrowRight className="h-4 w-4" /></button>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
