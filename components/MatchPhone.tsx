// components/MatchPhone.tsx — 📞 Profile popup එකේ (ගැලපුණු අයට): 
//   • ඒ කෙනා මට අංකය share කරලා නම් → අංකය + Call / WhatsApp
//   • මගේ අංකය **මේ කෙනාට විතරක්** පෙන්නනවද කියන switch එක (default: off)
"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, MessageCircle, Phone } from "lucide-react";
import { useLang } from "@/components/providers";
import { withPronoun } from "@/lib/pronoun"; // 👤 update-60: මෙයා / මොහු

export default function MatchPhone({ userId, name, gender }: { userId: string; name: string; gender?: string | null }) {
  const { t, lang } = useLang();
  const T = t.phone;
  const [data, setData] = useState<{ theirPhone: string | null; iShare: boolean; hasPhone: boolean; matched: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/phone?userId=${userId}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => { if (active && d) setData(d); }).catch(() => {});
    return () => { active = false; };
  }, [userId]);

  const toggle = async () => {
    if (!data || busy) return;
    const next = !data.iShare;
    setBusy(true);
    setData({ ...data, iShare: next });
    const res = await fetch("/api/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, share: next }) });
    if (!res.ok) setData({ ...data, iShare: !next });
    setBusy(false);
  };

  // ⏳ Load වෙනකම් skeleton (popup එක open වුණ ගමන් හිස් ඉඩක් / පස්සේ පැනලා එන එක නවත්වන්න)
  if (!data) return (
    <div className="mb-8 rounded-2xl border border-border bg-background p-5 shadow-sm" aria-busy="true">
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-6 w-48 animate-pulse rounded-lg bg-muted/70" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
  if (!data.matched) return null;
  const digits = data.theirPhone?.replace(/[^\d+]/g, "") ?? "";
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground"><Phone className="h-4 w-4 text-primary" /> {T.title}</h3>
        {data.theirPhone ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold tabular-nums tracking-wide">{data.theirPhone}</span>
            <a href={`tel:${digits}`} className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white"><Phone className="h-4 w-4" /> {T.call}</a>
            <a href={`https://wa.me/${digits.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-[#25D366]/10 px-4 py-2 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366] hover:text-white"><MessageCircle className="h-4 w-4" /> {T.whatsapp}</a>
          </div>
        ) : (
          <p className="flex items-start gap-2 text-sm text-muted-foreground"><Lock className="mt-0.5 h-4 w-4 shrink-0" /> {withPronoun(T.hidden, lang, gender)}</p>
        )}
      </div>
      {/* 👇 මගේ අංකය මේ කෙනාට විතරක් */}
      <div className="flex items-start gap-4 border-t border-border bg-muted/30 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{T.shareWith.replace("{name}", name)}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{data.hasPhone ? `${withPronoun(T.shareHint, lang, gender)} ${withPronoun(T.sharedNotice, lang, gender)}` : T.noPhone}</p>
        </div>
        <button type="button" role="switch" aria-checked={data.iShare} aria-label={T.shareWith.replace("{name}", name)} disabled={!data.hasPhone || busy} onClick={toggle} className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${data.iShare ? "bg-green-500" : "bg-muted-foreground/30"}`}>
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition ${data.iShare ? "translate-x-6" : "translate-x-1"}`}>{busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}</span>
        </button>
      </div>
    </div>
  );
}
