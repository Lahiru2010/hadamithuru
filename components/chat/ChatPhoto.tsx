// components/chat/ChatPhoto.tsx
// Chat එකේ ඡායාරූප: සාමාන්‍ය ඒවා bubble එකේම පේනවා, "view once" ඒවා tap කළාම එක් වරක් විතරයි (WhatsApp වගේ)
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Eye, EyeOff, ImageOff, Loader2, X, ShieldAlert } from "lucide-react";
import { useLang } from "@/components/providers";
import CanvasImage from "@/components/CanvasImage";

type Msg = { id: string; sender_id: string; image_path?: string | null; view_once?: boolean; viewed_at?: string | null; _localUrl?: string };

// 🔒 "View once" photo එක <img> එකක් නෙවෙයි, canvas එකක අඳිනවා — Inspect Element එකෙන් image link එකක් හොයාගන්න බෑ.
function OnceCanvas({ blob, onClose }: { blob: Blob; onClose: () => void }) {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    createImageBitmap(blob).then((bmp) => {
      if (cancelled || !canvasRef.current) return;
      const c = canvasRef.current;
      const scale = Math.min(1, (window.innerWidth * 0.9) / bmp.width, (window.innerHeight * 0.78) / bmp.height);
      c.width = Math.round(bmp.width * scale);
      c.height = Math.round(bmp.height * scale);
      c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
      bmp.close();
    });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { cancelled = true; window.removeEventListener("keydown", onKey); };
  }, [blob, onClose]);
  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[170] flex flex-col items-center justify-center bg-black/95 p-4 select-none" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
      <canvas ref={canvasRef} className="max-h-[80vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
      <p className="mt-4 flex max-w-md items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-center text-xs text-white/85">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" /> {t.photo.noDownload}
      </p>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
    </div>,
    document.body
  );
}

function Viewer({ src, onClose }: { src: string; onClose: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div data-modal-layer className="fixed inset-0 z-[170] flex flex-col items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}><CanvasImage src={src} fit="contain" className="max-h-[80vh] w-auto max-w-full rounded-xl" /></div>
      <p className="mt-4 flex max-w-md items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-center text-xs text-white/85">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" /> {t.photo.noDownload}
      </p>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
    </div>,
    document.body
  );
}

export default function ChatPhoto({ msg, isMe }: { msg: Msg; isMe: boolean }) {
  const { t } = useLang();
  const C = t.chat;
  const [open, setOpen] = useState(false);
  const [onceBlob, setOnceBlob] = useState<Blob | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gone, setGone] = useState(false);
  const [localViewed, setLocalViewed] = useState(false);
  const src = msg._localUrl ?? `/api/chat/image/${msg.id}`; // 👈 යවපු ගමන් local preview එක

  // ---------- සාමාන්‍ය ඡායාරූපය ----------
  if (!msg.view_once) {
    if (gone) return <p className="flex items-center gap-2 text-sm opacity-80"><ImageOff className="h-4 w-4" /> {C.gone}</p>;
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="relative block h-56 w-56 overflow-hidden rounded-xl bg-black/10">
          {/* 👇 Load වෙනකම් shimmer එකක් */}
          {!loaded && <span className="absolute inset-0 animate-pulse bg-muted" />}
          <CanvasImage src={src} alt={C.photo} onLoad={() => setLoaded(true)} onError={() => setGone(true)} className={`block h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`} />
        </button>
        {open && <Viewer src={src} onClose={() => setOpen(false)} />}
      </>
    );
  }

  // ---------- එක් වරක් බලන්න (view once) ----------
  const viewed = !!msg.viewed_at || localViewed;

  if (isMe) {
    // යවපු කෙනාට photo එක පේන්නේ නෑ — තත්ත්වය විතරයි
    return (
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-current text-[11px] font-bold">1</span>
        {C.photo} · {viewed ? C.opened : C.notOpened}
      </p>
    );
  }

  if (viewed && !onceBlob) {
    return <p className="flex items-center gap-2 text-sm italic opacity-70"><EyeOff className="h-4 w-4" /> {C.opened}</p>;
  }

  const openOnce = async () => {
    setLoading(true);
    const res = await fetch(src, { cache: "no-store" });
    setLoading(false);
    if (!res.ok) { setLocalViewed(true); return; }
    setOnceBlob(await res.blob());
  };

  return (
    <>
      <button type="button" onClick={openOnce} disabled={loading} className="flex items-center gap-2.5 rounded-xl text-sm font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current text-xs font-bold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "1"}
        </span>
        <span className="flex items-center gap-1.5"><Camera className="h-4 w-4" /> {C.tapToView}</span>
        <Eye className="h-4 w-4 opacity-60" />
      </button>
      {onceBlob && <OnceCanvas blob={onceBlob} onClose={() => { setOnceBlob(null); setLocalViewed(true); }} />}
    </>
  );
}
