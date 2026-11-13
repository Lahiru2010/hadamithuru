// components/ReportDialog.tsx — 🚩 User කෙනෙක්ව වාර්තා කරන්න (හේතුව + විස්තර), රහසිගතව admin ට යනවා
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Ban, Flag, Loader2, X, Check } from "lucide-react";
import { useLang } from "@/components/providers";

const REASONS = ["fake", "photos", "harass", "scam", "married", "other"] as const;

export default function ReportDialog({ userId, name, onClose, onBlock }: { userId: string; name: string; onClose: () => void; onBlock?: () => void }) {
  const { t } = useLang();
  const E = t.extra;
  const label: Record<(typeof REASONS)[number], string> = { fake: E.rFake, photos: E.rPhotos, harass: E.rHarass, scam: E.rScam, married: E.rMarried, other: E.rOther };
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const send = async () => {
    if (!reason) return;
    setState("sending");
    const res = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, reason, details: details.trim() || null }) });
    if (!res.ok) { setState("idle"); return; }
    setState("done"); // 👈 ස්තූතියි + (කැමති නම්) block කරන්න — user වහනකම් ඉන්නවා
  };

  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {state === "done" ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-600"><Check className="h-7 w-7" /></span>
            <p className="font-semibold">{E.reportThanks}</p>
            {/* 🚫 කැමති නම් මේ කෙනාව block කරන්නත් පුළුවන් */}
            {onBlock && <p className="text-sm text-muted-foreground">{E.reportBlockHint.replace("{name}", name)}</p>}
            <div className="mt-2 flex w-full gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted">{E.reportDone}</button>
              {onBlock && <button onClick={() => { onClose(); onBlock(); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700"><Ban className="h-4 w-4" /> {E.reportBlockBtn}</button>}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 p-5 pb-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold"><Flag className="h-5 w-5 text-red-500" /> {E.reportTitle.replace("{name}", name)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{E.reportHint.replaceAll("{name}", name)}</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div role="radiogroup" className="space-y-2 px-5">
              {REASONS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${reason === r ? "border-red-500 bg-red-500/5 font-semibold" : "border-border hover:border-red-500/40"}`}>
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${reason === r ? "border-red-500" : "border-muted-foreground/40"}`}>{reason === r && <span className="h-2 w-2 rounded-full bg-red-500" />}</span>
                  {label[r]}
                </button>
              ))}
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} placeholder={E.reportDetails} className="mt-1 w-full resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex gap-3 p-5">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted">{t.chat.cancel}</button>
              <button onClick={send} disabled={!reason || state === "sending"} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} {E.reportSend}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
