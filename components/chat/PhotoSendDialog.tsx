// components/chat/PhotoSendDialog.tsx
// ඡායාරූපයක් තෝරලා යවන්න කලින් preview + "එක් වරක් බලන්න" option එක
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Send, X } from "lucide-react";
import { useLang } from "@/components/providers";

export default function PhotoSendDialog({
  file,
  previewUrl,
  onCancel,
  onSend,
}: {
  file: File;
  previewUrl: string;
  onCancel: () => void;
  onSend: (file: File, viewOnce: boolean) => Promise<boolean>;
}) {
  const { t } = useLang();
  const C = t.chat;
  const [viewOnce, setViewOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setError(null);
    const ok = await onSend(file, viewOnce);
    setSending(false);
    if (!ok) setError(C.imageError);
  };

  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-bold">{C.attachPhoto}</h3>
          <button type="button" onClick={onCancel} disabled={sending} aria-label={C.cancel} className="rounded-full p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex max-h-[55vh] items-center justify-center bg-black">
          <img src={previewUrl} alt="" className="max-h-[55vh] w-full object-contain" />
        </div>

        {/* 👇 එක් වරක් බලන්න (WhatsApp වගේ) */}
        <button
          type="button"
          onClick={() => setViewOnce((v) => !v)}
          aria-pressed={viewOnce}
          className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition ${viewOnce ? "bg-primary/10" : "hover:bg-muted/50"}`}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${viewOnce ? "border-primary bg-primary text-white" : "border-muted-foreground text-muted-foreground"}`}>1</span>
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${viewOnce ? "text-primary" : ""}`}>{C.viewOnce}</span>
            <span className="block text-xs text-muted-foreground">{C.viewOnceHint}</span>
          </span>
        </button>

        {error && <p className="px-4 pt-3 text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 p-4">
          <button type="button" onClick={onCancel} disabled={sending} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted disabled:opacity-50">{C.cancel}</button>
          <button type="button" onClick={send} disabled={sending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E3324F] to-[#F0544F] py-3 text-sm font-semibold text-white disabled:opacity-70">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> {C.sending}</> : <><Send className="h-4 w-4" /> {C.send}</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
