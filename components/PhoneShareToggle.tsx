// components/PhoneShareToggle.tsx — 📞 "මගේ අංකය ගැලපුණු අයට පෙන්නන්න" switch එක (default: off)
"use client";

import { useEffect, useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { useLang } from "@/components/providers";

export default function PhoneShareToggle({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const T = t.phone;
  const [state, setState] = useState<{ show: boolean; hasPhone: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/phone", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setState(d)).catch(() => {});
  }, []);

  const toggle = async () => {
    if (!state || busy) return;
    const next = !state.show;
    setBusy(true);
    setState({ ...state, show: next });
    const res = await fetch("/api/phone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ show: next }) });
    if (!res.ok) setState({ ...state, show: !next });
    setBusy(false);
  };

  if (!state) return null;
  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm ${className}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Phone className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{T.toggleTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{state.hasPhone ? T.toggleHint : T.noPhone}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={state.show}
        aria-label={T.toggleTitle}
        disabled={!state.hasPhone || busy}
        onClick={toggle}
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${state.show ? "bg-green-500" : "bg-muted-foreground/30"}`}
      >
        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition ${state.show ? "translate-x-6" : "translate-x-1"}`}>{busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}</span>
      </button>
    </div>
  );
}
