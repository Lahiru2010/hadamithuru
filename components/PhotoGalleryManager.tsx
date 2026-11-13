// components/PhotoGalleryManager.tsx
// Wizard එකේ: profile photo එකට අමතරව තවත් photos 4ක් දක්වා දාන්න / අයින් කරන්න
// 🔒 මේ photos පේන්නේ interest එක accept කරපු අයට විතරයි (server එකෙන්ම check කරනවා)
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, Plus, Trash2, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import AvatarImage from "@/components/AvatarImage";

const MAX = 4;
type Photo = { id: string; url: string };

export default function PhotoGalleryManager({ userId, onBusyChange }: { userId: string; onBusyChange?: (busy: boolean) => void }) {
  const { t } = useLang();
  const T = t.photo;
  const { showConfirm } = useDialog();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0); // දැනට upload වෙන ගණන
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/photos?userId=${userId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (active) setPhotos(data.photos ?? []); })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [userId]);

  useEffect(() => { onBusyChange?.(uploading > 0); }, [uploading, onBusyChange]);

  const remaining = MAX - photos.length - uploading;

  // 👇 එකපාර photos කිහිපයක් තෝරන්නත් පුළුවන් (ඉතුරු ගණනට)
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(remaining, 0));
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setUploading((n) => n + files.length);

    for (const f of files) {
      try {
        const compressed = await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1600, initialQuality: 0.9, useWebWorker: true });
        const fd = new FormData();
        fd.append("file", compressed);
        const res = await fetch("/api/photos", { method: "POST", body: fd });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) throw new Error(data?.error ?? T.errUpload);
        setPhotos((p) => [...p, { id: data.id, url: data.url }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : T.errUpload);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const remove = async (photo: Photo) => {
    const ok = await showConfirm({ title: T.deletePhotoTitle, message: T.deletePhotoMsg, confirmText: T.delete, cancelText: T.cancel, tone: "danger" });
    if (!ok) return;
    setPhotos((p) => p.filter((x) => x.id !== photo.id));
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    if (!res.ok) { setPhotos((p) => [...p, photo]); setError(T.errUpload); }
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold">{T.galleryTitle}</h3>
        <span className="text-xs font-semibold text-muted-foreground">{T.galleryCount.replace("{n}", String(photos.length)).replace("{max}", String(MAX))}</span>
      </div>
      <p className="text-sm text-muted-foreground">{T.galleryHint}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <Lock className="h-3.5 w-3.5" /> {T.galleryPrivate}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />)
          : photos.map((p) => (
              <div key={p.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
                <AvatarImage src={p.url} shape="rounded-2xl" className="h-full w-full" />
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label={T.delete}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`u${i}`} className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">{T.uploading}</span>
          </div>
        ))}

        {!loading && remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="h-5 w-5" /></span>
            <span className="text-xs font-semibold">{T.addMore}</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
