// components/BoostCard.tsx — ⚡ Plans page එකේ "ඔබේ පැතිකඩ Boost කරන්න" (ඉල්ලීම → admin activate)
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Clock, Loader2, Zap } from "lucide-react";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import type { BoostConfig } from "@/lib/pricing";
import BoostProgress, { boostTimeLeft } from "@/components/BoostProgress";

export default function BoostCard({ boost }: { boost: BoostConfig }) {
  const { t } = useLang();
  const B = t.boost;
  const { showAlert } = useDialog();
  const [me, setMe] = useState<{ boostedUntil: string | null; startedAt?: string | null; pending: boolean } | null | "guest">(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/boost", { cache: "no-store" }).then((r) => (r.status === 401 ? "guest" : r.ok ? r.json() : null)).then((d) => setMe(d)).catch(() => setMe(null));
  }, []);

  const request = async () => {
    setBusy(true);
    const res = await fetch("/api/boost", { method: "POST" });
    setBusy(false);
    if (!res.ok) return showAlert({ title: B.error, tone: "error" });
    setMe((m) => (m && m !== "guest" ? { ...m, pending: true } : { boostedUntil: null, pending: true }));
  };

  const active = me && me !== "guest" && me.boostedUntil && new Date(me.boostedUntil) > new Date();

  return (
    <section className="relative mt-12 overflow-hidden rounded-[2rem] border border-amber-400/40 bg-gradient-to-br from-amber-50 via-background to-rose-50 p-6 shadow-sm dark:from-amber-950/30 dark:to-rose-950/20 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30"><Zap className="h-8 w-8 fill-white" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold">{B.title}</h2>
          <p className="mt-1 text-muted-foreground">{B.desc.replace("{days}", String(boost.days))}</p>
          <p className="mt-3 text-3xl font-extrabold text-foreground">{B.price.replace("{price}", boost.priceLkr.toLocaleString()).replace("{days}", String(boost.days))}</p>
          <p className="mt-2 text-xs text-muted-foreground">{B.payNote}</p>
        </div>
        <div className="shrink-0">
          {me === "guest" ? (
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-amber-950 shadow-lg shadow-amber-500/25"><Zap className="h-5 w-5" /> {B.request}</Link>
          ) : active ? (
            // ⚡ සක්‍රිය boost — progress bar + ඉවර වෙන්න ළඟ නම් "නැවත Boost කරන්න"
            <div className="w-72 max-w-full space-y-3 rounded-2xl bg-background/80 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400"><Check className="h-4 w-4" /> {B.active.replace("{date}", new Date((me as { boostedUntil: string }).boostedUntil).toLocaleDateString())}</p>
              <BoostProgress until={(me as { boostedUntil: string }).boostedUntil} startedAt={(me as { startedAt?: string | null }).startedAt} />
              {me && !(me as { pending: boolean }).pending && boostTimeLeft((me as { boostedUntil: string }).boostedUntil).ms < 2 * 86400_000 && (
                <button type="button" onClick={request} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-2 text-sm font-bold text-amber-950 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} {B.renew}</button>
              )}
              {me && (me as { pending: boolean }).pending && <p className="text-xs text-amber-700 dark:text-amber-400">{B.pending}</p>}
            </div>
          ) : me && me.pending ? (
            <p className="flex max-w-xs items-start gap-2 rounded-xl bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-800 dark:text-amber-300"><Clock className="mt-0.5 h-5 w-5 shrink-0" /> {B.pending}</p>
          ) : (
            <button type="button" onClick={request} disabled={busy || me === null} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3 font-bold text-amber-950 shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5 disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />} {B.request}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
