// components/HoroscopeMatch.tsx — 💞 Profile popup එකේ (ගැලපුණු අයට විතරයි): පොරොන්දම් සාරාංශය + සම්පූර්ණ වගුව
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Info, Sparkles, Star, X } from "lucide-react";
import { useLang } from "@/components/providers";
import { PORONDAM_8, type FullPorondam } from "@/lib/porondam";

function Ring({ percent, size = 72 }: { percent: number; size?: number }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${(percent / 100) * c} ${c}`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 4.2} fontWeight="800" fill="var(--foreground)" transform={`rotate(90 ${size / 2} ${size / 2})`}>{percent}%</text>
    </svg>
  );
}

export default function HoroscopeMatch({ userId, name }: { userId: string; name: string }) {
  const { t, lang } = useLang();
  const H = t.horo;
  const [d, setD] = useState<{ mine: boolean; theirs: boolean; matched?: boolean; result?: FullPorondam } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/horoscope/match?userId=${userId}&lang=${lang}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((x) => { if (active) setD(x); }).catch(() => {});
    return () => { active = false; };
  }, [userId, lang]);

  // ⌨️ Esc → වගුව විතරක් වහනවා
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  // ⏳ Load වෙනකම් skeleton
  if (!d) return (
    <div className="mb-8 rounded-2xl border border-border bg-background p-5 shadow-sm" aria-busy="true">
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="flex items-center gap-5">
        <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-muted" />
        <div className="space-y-2"><div className="h-4 w-36 animate-pulse rounded bg-muted/70" /><div className="h-4 w-28 animate-pulse rounded bg-muted/70" /></div>
      </div>
    </div>
  );
  if (!d.theirs) return null;
  // 🔒 තවම ගැලපිලා නැත්නම් — කේන්දරයක් තියෙනවා කියලා විතරයි
  if (d.matched === false) return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
      <div>
        <p className="font-bold text-foreground">{H.lockedTitle}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{H.lockedText}</p>
      </div>
    </div>
  );
  const R = d.result;
  const label = (k: string) => H[`q_${k}` as keyof typeof H] as string;

  return (
    <div className="mb-8 rounded-2xl border border-border bg-background p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> {H.matchTitle.replace(/\s*\(.*\)/, "")}</h3>
      {!d.mine || !R ? (
        <Link href="/horoscope" className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white">{H.matchNeedMine} →</Link>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-5">
            <Ring percent={R.percent} />
            <div className="space-y-1.5 text-sm">
              <p><span className="font-extrabold">{R.score8}/8</span> <span className="text-muted-foreground">· {H.eight}</span></p>
              <p><span className="font-extrabold">{R.score20}/{R.computed20}</span> <span className="text-muted-foreground">· {H.twenty}</span></p>
            </div>
            <button type="button" onClick={() => setOpen(true)} className="ml-auto rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary">{H.viewTable}</button>
          </div>
          {/* 🔥 දෝෂ — හැම දෝෂයක්ම එක ලකුණකින් (විස්තර වගුවේ) */}
          {(() => {
            const bad = R.doshas.filter((x) => !x.ok).length;
            return (
              <button type="button" onClick={() => setOpen(true)} title={H.doshaNote} className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${bad ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>
                {bad ? <><Info className="h-3.5 w-3.5" /> {H.doshaBad}</> : <><Check className="h-3.5 w-3.5" /> {H.doshas}: {H.doshaOk}</>}
              </button>
            );
          })()}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">⚠️ {H.matchNote}</p>
        </>
      )}

      {/* 📋 සම්පූර්ණ පොරොන්දම් වගුව */}
      {open && R && createPortal(
        // 👇 data-modal-layer — මේක වහනකොට පිටිපස්සේ profile popup එක වැහෙන්නේ නෑ (ProfileModal එකේ outside-click / Esc නීතිය)
        <div data-modal-layer className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-[2rem] bg-background shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-center gap-4 border-b border-border p-5">
              <Ring percent={R.percent} size={60} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold">{H.tableTitle}</h2>
                <p className="text-sm text-muted-foreground">{H.eight}: <b className="text-foreground">{R.score8}/8</b> · {H.twenty}: <b className="text-foreground">{R.score20}/{R.computed20}</b></p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[62dvh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 text-xs uppercase text-muted-foreground backdrop-blur">
                  <tr><th className="px-4 py-2.5 text-left">{H.colPorondam}</th><th className="px-3 py-2.5 text-left">{H.colYou}</th><th className="px-3 py-2.5 text-left">{H.colThem.replace("{name}", name.split(" ")[0] || "")}</th><th className="px-4 py-2.5 text-right">{H.colResult}</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {R.rows.map((r) => (
                    <tr key={r.key} className={r.ok === null ? "text-muted-foreground" : ""}>
                      <td className="px-4 py-2.5 font-semibold">{PORONDAM_8.includes(r.key) && <Star className="mr-1 inline h-3 w-3 fill-amber-400 text-amber-400" />}{label(r.key)}</td>
                      <td className="px-3 py-2.5">{r.mine ?? "—"}</td>
                      <td className="px-3 py-2.5">{r.theirs ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        {r.ok ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-600"><Check className="h-4 w-4" /></span>
                          : <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-500"><X className="h-4 w-4" /></span>}
                      </td>
                    </tr>
                  ))}
                  {/* 🔥 දෝෂ */}
                  <tr className="bg-muted/40"><td colSpan={4} className="px-4 py-2 text-xs font-bold uppercase text-muted-foreground">{H.doshas}</td></tr>
                  {R.doshas.map((d) => (
                    <tr key={d.key}>
                      <td className="px-4 py-2.5 font-semibold">{H[`d_${d.key}` as keyof typeof H] as string}</td>
                      <td className="px-3 py-2.5">{d.mine ? H.dYes : H.dNo}</td>
                      <td className="px-3 py-2.5">{d.theirs ? H.dYes : H.dNo}</td>
                      <td className="px-4 py-2.5 text-right">{d.ok ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-600"><Check className="h-4 w-4" /></span> : <span title={H.doshaAdvice} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600"><Info className="h-4 w-4" /></span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border p-4 text-xs leading-relaxed text-muted-foreground">{H.key8} · {H.doshaNote} · ⚠️ {H.matchNote}</div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
