// components/MatchCelebration.tsx — 🎉 ඇරයුමක් accept කළාම "ඔබ දෙදෙනා ගැලපුණා!" + සුබ පැතුම (profile popup එකට උඩින්)
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { HeartHandshake, MessageCircle, X } from "lucide-react";
import { useLang } from "@/components/providers";

// 🎊 වැටෙන hearts / confetti (ස්ථාවර අගයන්)
const BITS = Array.from({ length: 26 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 7) * 0.18, dur: 2.2 + (i % 5) * 0.35, size: 12 + (i % 4) * 5, heart: i % 3 !== 0 }));

export default function MatchCelebration({ name, userId, onClose }: { name: string; userId: string; onClose: () => void }) {
  const { t } = useLang();
  const C = t.celebrate;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[240] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-backdrop" onClick={onClose}>
      <style>{`@keyframes seneha-confetti{0%{transform:translateY(-10vh) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(105vh) rotate(540deg);opacity:0}}`}</style>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden">
        {BITS.map((b, i) => (
          <span key={i} className="absolute top-0" style={{ left: `${b.left}%`, animation: `seneha-confetti ${b.dur}s ease-in ${b.delay}s infinite`, fontSize: b.size, color: i % 2 ? "#D61F55" : "#F0544F" }}>{b.heart ? "❤" : "✦"}</span>
        ))}
      </div>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-background text-center shadow-2xl animate-modal-content">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"><X className="h-5 w-5" /></button>
        <div className="bg-gradient-to-br from-[#D61F55] to-[#B5123F] px-6 pb-10 pt-10 text-white">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-8 ring-white/10 motion-safe:animate-[float_3s_ease-in-out_infinite]"><HeartHandshake className="h-10 w-10" /></span>
          <h2 className="mt-5 text-3xl font-extrabold">{C.title}</h2>
          <p className="mt-2 text-white/90">{C.matched.replace("{name}", name)}</p>
        </div>
        <div className="px-6 pb-6 pt-6">
          <p className="text-lg font-semibold leading-relaxed text-foreground">💐 {C.wish}</p>
          <p className="mt-2 text-sm text-muted-foreground">{C.next}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted">{C.later}</button>
            <Link href={`/chat?userId=${userId}`} className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] py-3 text-sm font-bold text-white shadow-lg shadow-primary/25"><MessageCircle className="h-4 w-4" /> {C.chat}</Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
