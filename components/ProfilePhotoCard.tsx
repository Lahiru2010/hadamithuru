// components/ProfilePhotoCard.tsx
// Profile photo upload කරන කොටස:
//  - Photo එක තෝරපු ගමන් crop කරන popup එකක් (drag + zoom) — "Save photo" ඔබපු ගමන් auto upload වෙනවා
//    (වෙනම Save button එකක් නෑ, ඒ නිසා save නොකර ඉස්සරහට යන එකක් වෙන්නේ නෑ)
//  - "ඔබට පේන විදිහ" සහ "අනිත් අයට පේන විදිහ" දෙකම එක ළඟ (අලුත් photo එක තෝරපු ගමනුත්)
//  - Blur toggle එක ක්ෂණිකව වෙනස් වෙනවා, save වෙන එක පොඩි "Saving… / Saved ✓" එකකින් පේනවා
//  - හැම text එකක්ම language එකට අනුව
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, Eye, EyeOff, Loader2, ZoomIn, ZoomOut, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useLang } from "@/components/providers";
import AvatarImage from "@/components/AvatarImage";

type AvatarState = { originalUrl: string | null; publicUrl: string | null; blurEnabled: boolean };
type BlurStatus = "idle" | "saving" | "saved" | "error";

function preloadImage(url: string | null) {
  return new Promise<void>((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// Crop කරපු කොටස canvas එකකින් කපලා අලුත් image file එකක් හදනවා
async function cropImage(src: string, area: Area): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const size = Math.min(area.width, 1600); // ඕනවට වඩා ලොකු නොවෙන්න
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round((area.height / area.width) * size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Crop failed");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export default function ProfilePhotoCard({
  compact = false,
  onBusyChange,
  onPhotoChange,
}: {
  compact?: boolean;
  /** Upload වෙන අතරතුර true — wizard එකේ "Save & Continue" එක ඒ වෙලාවට නවත්තනවා */
  onBusyChange?: (busy: boolean) => void;
  /** Photo එකක් තියෙනවද කියලා (wizard එකේ progress එකට) */
  onPhotoChange?: (hasPhoto: boolean) => void;
}) {
  const { t } = useLang();
  const T = t.photo;

  const [avatar, setAvatar] = useState<AvatarState>({ originalUrl: null, publicUrl: null, blurEnabled: false });
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);

  // Crop popup එක
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<Area | null>(null);

  // Blur toggle එක (ඉක්මනට කීපාරක් click කළත් අන්තිම එක විතරයි server එකට යන්නේ)
  const [blurStatus, setBlurStatus] = useState<BlurStatus>("idle");
  const desiredBlur = useRef<boolean | null>(null);
  const blurInFlight = useRef(false);

  const busy = saving || compressing;

  // Wizard එකට දැනුම් දෙනවා
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const load = async () => {
    const res = await fetch("/api/avatar/me", { cache: "no-store" });
    if (res.ok) {
      const data: AvatarState = await res.json();
      await preloadImage(data.originalUrl);
      setAvatar(data);
      onPhotoChange?.(!!data.originalUrl);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (cropSrc) URL.revokeObjectURL(cropSrc); }, [cropSrc]);

  // ---------- 1) File එක තෝරනවා → crop popup එක ----------
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError(T.errType);
    if (f.size > 20 * 1024 * 1024) return setError(T.errSize);
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(f));
  };

  // ---------- 2) Crop කරලා compress කරලා ඒ ගමන්ම upload කරනවා ----------
  const confirmCrop = async () => {
    if (!cropSrc || !cropArea) return;
    setCompressing(true);
    setError(null);
    let compressed: File;
    try {
      const cropped = await cropImage(cropSrc, cropArea);
      compressed = await imageCompression(cropped, { maxSizeMB: 1, maxWidthOrHeight: 1600, initialQuality: 0.9, useWebWorker: true });
    } catch {
      setCompressing(false);
      return setError(T.errProcess);
    }
    setCompressing(false);
    setCropSrc(null);
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed)); // Upload වෙන අතරතුර අලුත් photo එක පෙන්නනවා
    await upload(compressed);
  };

  // ---------- 3) Upload ----------
  const upload = async (f: File) => {
    setSaving(true);
    setError(null);
    setPhotoSaved(false);
    const fd = new FormData();
    fd.append("file", f);
    fd.append("blur", String(avatar.blurEnabled));
    const res = await fetch("/api/avatar", { method: "POST", body: fd });
    if (!res.ok) {
      setSaving(false);
      setPreview(null); // වැරදුණොත් පරණ photo එක ආපහු පෙන්නනවා, "Try again" එකෙන් ආයේ උත්සාහ කරන්න පුළුවන්
      const data = await res.json().catch(() => null);
      return setError(`${T.errUpload} (${res.status}): ${data?.error ?? "Unknown error"}`);
    }
    await load();
    setPreview(null);
    setFile(null);
    setSaving(false);
    setPhotoSaved(true);
    setTimeout(() => setPhotoSaved(false), 2500);
    window.dispatchEvent(new Event("avatar-updated")); // navbar එකේ photo එකත් අලුත් කරන්න
  };

  // ---------- Blur toggle (UI එක freeze වෙන්නේ නෑ) ----------
  const syncBlur = useCallback(async () => {
    if (blurInFlight.current) return;
    blurInFlight.current = true;
    setBlurStatus("saving");
    let lastSent: boolean | null = null;
    let failed = false;

    // User ඉක්මනට කීපාරක් click කළොත්, අන්තිම තත්ත්වය save වෙනකම් loop වෙනවා
    while (desiredBlur.current !== null && desiredBlur.current !== lastSent) {
      const target: boolean = desiredBlur.current;
      const res = await fetch("/api/avatar/blur", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blur: target }),
      });
      if (!res.ok) { failed = true; break; }
      lastSent = target;
    }

    blurInFlight.current = false;
    if (failed) {
      // වැරදුණොත් කලින් save වුණු තත්ත්වයට ආපහු
      setAvatar((a) => ({ ...a, blurEnabled: lastSent ?? !a.blurEnabled }));
      desiredBlur.current = null;
      setBlurStatus("error");
      return;
    }
    setBlurStatus("saved");
    window.dispatchEvent(new Event("avatar-updated"));
    setTimeout(() => setBlurStatus((s) => (s === "saved" ? "idle" : s)), 2000);
  }, []);

  const toggleBlur = () => {
    const next = !avatar.blurEnabled;
    setAvatar((a) => ({ ...a, blurEnabled: next })); // ක්ෂණිකව
    desiredBlur.current = next;
    syncBlur();
  };

  const shownImage = preview ?? avatar.originalUrl;

  return (
    <section className={compact ? "" : "rounded-3xl border border-border p-8"}>
      {/* 👇 Wizard එක ඇතුළෙත් "පැතිකඩ ඡායාරූපය" කියලා පැහැදිලිව */}
      {compact ? <h3 className="font-semibold">{T.title}</h3> : <h2 className="text-2xl font-semibold">{T.title}</h2>}
      <p className="mt-1 text-sm text-muted-foreground">{T.desc}</p>

      {/* 👇 දෙකම එක ළඟ: ඔබට පේන විදිහ | අනිත් අයට පේන විදිහ */}
      <div className="mt-6 flex flex-wrap gap-6 sm:gap-10">
        <figure className="text-center">
          {loading ? (
            <div className="h-36 w-36 animate-pulse rounded-2xl bg-muted" />
          ) : (
            // <label> එකක් ඇතුළේ file input එක → හැම browser එකකම click/tap කළාම file picker එක එනවා
            <label
              aria-label={shownImage ? T.changePhoto : T.addPhoto}
              className={`group relative block h-36 w-36 rounded-2xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 focus-within:ring-offset-background ${busy ? "cursor-wait" : "cursor-pointer"}`}
            >
              <input type="file" accept="image/*" className="sr-only" onChange={onPick} disabled={busy} />
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                {shownImage
                  ? <AvatarImage key={shownImage} src={shownImage} shape="rounded-2xl" className="h-full w-full" />
                  : <Camera className="h-10 w-10 text-muted-foreground" />}
              </span>
              {shownImage && !busy && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-8 w-8 text-white" />
                </span>
              )}
              {shownImage && !busy && (
                <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg ring-4 ring-background">
                  <Camera className="h-4 w-4" />
                </span>
              )}
              {busy && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/60 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-medium">{saving ? T.uploading : T.processing}</span>
                </span>
              )}
            </label>
          )}
          <figcaption className="mt-3 text-sm text-muted-foreground">
            {loading ? T.loading : preview ? T.newPhoto : shownImage ? T.youSee : T.addPhoto}
          </figcaption>
        </figure>

        {!loading && shownImage && (
          <figure className="text-center">
            <div className="h-36 w-36 overflow-hidden rounded-2xl border border-border">
              <img
                src={shownImage}
                alt=""
                className="h-full w-full scale-110 object-cover transition-[filter] duration-300"
                style={{ filter: avatar.blurEnabled ? "blur(8px)" : "none" }}
              />
            </div>
            <figcaption className="mt-3 text-sm text-muted-foreground">{T.othersSee}</figcaption>
          </figure>
        )}
      </div>

      {/* 👇 Upload වුණාම පොඩි "✓ සුරැකුණා" එකක් */}
      <div className="mt-3 h-5 text-sm font-medium" aria-live="polite">
        {photoSaved && <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><Check className="h-4 w-4" /> {T.photoSaved}</span>}
      </div>

      {/* Blur toggle */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border p-5">
        {avatar.blurEnabled ? <EyeOff className="h-6 w-6 shrink-0 text-primary" /> : <Eye className="h-6 w-6 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{T.blurTitle}</p>
          <p className="text-sm text-muted-foreground">{T.blurDesc}</p>
          {/* 👇 Save වෙනවද කියලා පොඩි status එකක් — UI එක block කරන්නේ නෑ */}
          <div className="mt-1 h-4 text-xs font-medium" aria-live="polite">
            {blurStatus === "saving" && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> {T.blurSaving}</span>}
            {blurStatus === "saved" && <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Check className="h-3 w-3" /> {T.blurSaved}</span>}
            {blurStatus === "error" && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-3 w-3" /> {T.errBlur}</span>}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={avatar.blurEnabled}
          aria-label={T.blurTitle}
          onClick={toggleBlur}
          disabled={loading || saving}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${avatar.blurEnabled ? "bg-primary" : "bg-neutral-500/60"} disabled:opacity-50`}
        >
          <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${avatar.blurEnabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          {file && !busy && (
            <button type="button" onClick={() => upload(file)} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">
              {T.retry}
            </button>
          )}
        </div>
      )}

      {/* ---------- Crop popup ---------- */}
      {cropSrc && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={T.cropTitle}>
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
            <div className="p-5 pb-3">
              <h3 className="text-lg font-bold">{T.cropTitle}</h3>
              <p className="text-xs text-muted-foreground">{T.cropHint}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{T.autoSaveNote}</p>
            </div>

            <div className="relative h-80 w-full bg-black">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid
                objectFit="contain"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCropArea(pixels)}
                style={{ cropAreaStyle: { borderRadius: "1rem", border: "2px solid rgba(255,255,255,0.9)" } }}
              />
            </div>

            <div className="flex items-center gap-3 px-5 pt-4">
              <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label={T.zoom}
                className="w-full accent-[#D61F55]"
              />
              <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>

            <div className="flex gap-3 p-5">
              <button type="button" onClick={() => setCropSrc(null)} disabled={compressing} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted disabled:opacity-50">
                {T.cancel}
              </button>
              <button type="button" onClick={confirmCrop} disabled={compressing || !cropArea} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] py-3 text-sm font-semibold text-white disabled:opacity-60">
                {compressing ? <><Loader2 className="h-4 w-4 animate-spin" /> {T.processing}</> : <><Check className="h-4 w-4" /> {T.save}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
