// components/AfterSendDialog.tsx — 💌 කැමැත්ත යැව්වාට පස්සේ අලුත් popup එකක්: "තවත් ගැලපෙන අය" + එක click එකෙන් කැමැත්ත යවන්න
// අරමුණ: user දිගටම කැමැත්ත යවන්න පොළඹවන්න (continue / push)
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Heart, Loader2, MapPin, Sparkles, X } from "lucide-react";
import { useLang } from "@/components/providers";
import CardImage from "@/components/CardImage";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { SendInterestResult } from "@/components/ProfileModal";

type P = { id: string; full_name: string; age?: number; district?: string; city?: string; avatar_url?: string; avatar_placeholder?: string | null; id_verified?: string };

export default function AfterSendDialog({ name, profiles, matchOf, onSend, onView, onClose }: {
  name: string;
  profiles: P[];
  matchOf: (id: string) => number | null;
  onSend: (id: string) => Promise<SendInterestResult | void>;
  onView: (p: P) => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const R = t.prefs;
  const L = t.profile;
  const [state, setState] = useState<Record<string, "sending" | "sent">>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = async (id: string) => {
    setState((s) => ({ ...s, [id]: "sending" }));
    const r = await onSend(id);
    setState((s) => ({ ...s, [id]: r && (r.status === "sent" || r.status === "already") ? "sent" : (undefined as unknown as "sent") }));
  };
  const sentCount = Object.values(state).filter((v) => v === "sent").length;

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm animate-modal-backdrop sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-background shadow-2xl animate-modal-content sm:rounded-[2rem]">
        {/* 🎉 Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#D61F55] to-[#B5123F] px-6 pb-8 pt-7 text-center text-white">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/15 p-2 transition hover:bg-white/25"><X className="h-5 w-5" /></button>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/10 motion-safe:animate-[float_3s_ease-in-out_infinite]"><Heart className="h-8 w-8 fill-white" /></span>
          <h2 className="mt-4 text-2xl font-extrabold">{R.afterSendTitle.replace("{name}", name)}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/85">{R.afterSendSub}</p>
        </div>

        {/* 💞 යෝජනා — එක click එකෙන් කැමැත්ත */}
        <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3">
          {profiles.map((p) => {
            const m = matchOf(p.id);
            const st = state[p.id];
            return (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <button type="button" onClick={() => onView(p)} className="relative h-36 w-full overflow-hidden bg-muted text-left">
                  <CardImage src={p.avatar_url} placeholder={p.avatar_placeholder} alt={p.full_name} />
                  {m !== null && <span className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow"><Sparkles className="h-3 w-3" /> {m}%</span>}
                </button>
                <div className="flex flex-1 flex-col p-3">
                  <p className="flex items-center gap-1 truncate text-sm font-bold"><span className="truncate">{p.full_name}</span>{p.id_verified === "Yes" && <VerifiedBadge />}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {[p.age && L.age.replace("{age}", String(p.age)), p.city || p.district].filter(Boolean).join(" · ")}</p>
                  <button
                    type="button"
                    onClick={() => send(p.id)}
                    disabled={!!st}
                    className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${st === "sent" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-gradient-to-r from-[#D61F55] to-[#B5123F] text-white shadow-sm hover:opacity-90"}`}
                  >
                    {st === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : st === "sent" ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                    {st === "sent" ? L.interestSent : L.sendInterest}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">{sentCount > 0 && <span className="font-semibold text-green-700 dark:text-green-400">✓ {sentCount}</span>}</p>
          <button onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-primary/50 hover:text-primary">{R.afterSendMore}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
