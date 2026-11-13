// components/ProfileGallery.tsx
// Profile popup එකේ අමතර photos. Accept කරපු අයට විතරයි photos පේන්නේ; අනිත් අයට 🔒 "තවත් ඡායාරූප Xක්" විතරයි.
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Lock, X, ShieldAlert } from "lucide-react";
import { useLang } from "@/components/providers";
import CanvasImage from "@/components/CanvasImage";

type Photo = { id: string; url: string };

export default function ProfileGallery({
  userId,
  mainPhoto,
  initialMeta,
  adminView = false,
  initialPhotos,
  eager = false,
}: {
  userId: string;
  /** දැනටමත් අතේ තියෙන photo links (උදා: My profile preview) — ඒ ගමන්ම පෙන්නනවා, load වෙනකම් බලන් ඉන්න ඕන නෑ */
  initialPhotos?: string[];
  /** Photos කීයක්ද කියලා තාම දන්නේ නැතත් ඒ ගමන්ම skeleton එකක් පෙන්නන්න (preview) */
  eager?: boolean;
  /** Admin dashboard එකෙන් බලනකොට විතරයි — ඇත්ත photos ඔක්කොම (browse කරනකොට නෑ) */
  adminView?: boolean;
  mainPhoto?: string | null;
  /** Browse page එකෙන් දැනටමත් දන්නවා නම් (photos ගණන / lock) — request එක එනකම් බලන් ඉන්න ඕන නෑ */
  initialMeta?: { locked: boolean; count: number } | null;
}) {
  const { t } = useLang();
  const T = t.photo;
  const [meta, setMeta] = useState<{ locked: boolean; count: number } | null>(initialMeta ?? null);
  const [state, setState] = useState<{ locked: boolean; count: number; photos: Photo[] } | null>(
    initialPhotos && initialPhotos.length ? { locked: false, count: initialPhotos.length, photos: initialPhotos.map((url, i) => ({ id: `init-${i}`, url })) } : null,
  );
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    // 👇 1) ඉක්මන් request එකක්: photos කීයක්ද, බලන්න අවසර තියෙනවද (skeleton එක ඒ ගණනට පෙන්නන්න)
    if (!initialMeta) {
      fetch(`/api/photos?userId=${userId}&meta=1${adminView ? "&admin=1" : ""}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (active && data) setMeta(data); });
    }
    // 👇 2) ඒ එක්කම photos links (signed URLs) — මේකට ටිකක් වැඩි වෙලාවක් යනවා
    fetch(`/api/photos?userId=${userId}${adminView ? "&admin=1" : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active && data) setState(data); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Lightbox එකේ keyboard (← → Esc)
  const all = state && !state.locked ? [...(mainPhoto ? [{ id: "main", url: mainPhoto }] : []), ...state.photos] : [];
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % all.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + all.length) % all.length));
    };
    // Capture phase + stopPropagation → Esc එකෙන් photo එක විතරයි වැහෙන්නේ, profile popup එක නෙවෙයි
    const capture = (e: KeyboardEvent) => { if (["Escape", "ArrowLeft", "ArrowRight"].includes(e.key)) { e.stopPropagation(); onKey(e); } };
    window.addEventListener("keydown", capture, true);
    return () => window.removeEventListener("keydown", capture, true);
  }, [open, all.length]);

  const info = state ?? meta;

  // Photos තියෙනවද කියලා තාම දන්නේ නැත්නම් කිසිවක් පෙන්නන්නේ නෑ (photos නැති අයට skeleton එකක් පේන එක වළක්වන්න)
  // 👇 eager (preview) නම් — popup එක open වුණ ගමන්ම skeleton එක
  if (!info && eager) {
    return (
      <div aria-busy="true">
        <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="flex gap-3 overflow-hidden pb-1">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 w-24 shrink-0 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    );
  }
  if (!info) return null;
  if (info.count === 0) return null;

  // 🔒 තාම ගැලපිලා නැත්නම්
  if (info.locked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lock className="h-5 w-5" /></span>
        <div>
          <p className="text-sm font-semibold">{T.lockedPhotos.replace("{n}", String(info.count))}</p>
          <p className="text-xs text-muted-foreground">{T.lockedHint}</p>
        </div>
      </div>
    );
  }

  // 👇 Links එනකම්: title එක + photos ගණනටම skeleton tiles
  if (!state) {
    const total = info.count + (mainPhoto ? 1 : 0);
    return (
      <div aria-busy="true">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {T.photosTitle} <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] normal-case tracking-normal">{total}</span>
        </h3>
        <div className="flex gap-3 overflow-hidden pb-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="h-28 w-24 shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {T.photosTitle} <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] normal-case tracking-normal">{all.length}</span>
      </h3>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 py-1 custom-scrollbar">
        {all.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-border transition hover:ring-2 hover:ring-primary">
            <CanvasImage src={p.url} className="block h-full w-full" />
          </button>
        ))}
      </div>

      {/* Lightbox — document.body එකට portal එකකින් (popup එකේ transform එක ඇතුළේ හිරවෙන්නේ නැති වෙන්න) */}
      {open !== null && all[open] && createPortal(
        <div
          data-modal-layer
          className="fixed inset-0 z-[160] flex flex-col items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setOpen(null)}
        >
          {/* 👇 Back / Next buttons photo එකේ දෙපැත්තෙන්ම (window එකේ කෙළවරට නෙවෙයි) */}
          <div className="flex max-w-full items-center gap-3 sm:gap-5" onClick={(e) => e.stopPropagation()}>
            {all.length > 1 && (
              <button type="button" onClick={() => setOpen((open - 1 + all.length) % all.length)} aria-label="Previous" className="shrink-0 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/30 sm:p-3"><ChevronLeft className="h-6 w-6" /></button>
            )}
            {/* 🔒 canvas එකක (Inspect Element එකෙන් img link එකක් ගන්න බෑ) */}
            <CanvasImage key={all[open].url} src={all[open].url} fit="contain" className="max-h-[78vh] w-auto min-w-0 max-w-[calc(100vw-9rem)] rounded-xl sm:max-w-[min(70vw,900px)]" />
            {all.length > 1 && (
              <button type="button" onClick={() => setOpen((open + 1) % all.length)} aria-label="Next" className="shrink-0 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/30 sm:p-3"><ChevronRight className="h-6 w-6" /></button>
            )}
          </div>
          {/* 👇 1 / 3 — photo එකට යටින් මැදින් */}
          {all.length > 1 && <span className="mt-4 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white" onClick={(e) => e.stopPropagation()}>{open + 1} / {all.length}</span>}
          {/* 🔒 Download කරන්න එපා කියලා */}
          <p className="mt-4 flex max-w-md items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-center text-xs text-white/85 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" /> {T.noDownload}
          </p>
          <button type="button" onClick={() => setOpen(null)} aria-label={T.close} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-6 w-6" /></button>
          {all.length > 1 && (
            <>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
