// components/CanvasImage.tsx
// 🔒 Photo එක <img> tag එකක් නැතුව <canvas> එකක අඳිනවා.
// Inspect Element එකෙන් "img src" එකක් හොයාගෙන right-click → "Open image" / "Save image" කරන්න බෑ.
// (Browser එකට පේන ඕනම දෙයක් screenshot කරන්න / Network tab එකෙන් ගන්න සම්පූර්ණයෙන් නවත්තන්න කිසිම site එකකට බෑ —
//  ඒත් මේකෙන් සාමාන්‍ය user කෙනෙකුට ලේසියෙන් photo එක download කරගන්න බැරි වෙනවා.)
"use client";

import { useEffect, useRef, useState } from "react";

const cache = new Map<string, Promise<ImageBitmap>>(); // එකම photo එක දෙපාරක් download නොකරන්න

function loadBitmap(src: string) {
  let p = cache.get(src);
  if (!p) {
    p = fetch(src, { credentials: "same-origin" })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((b) => createImageBitmap(b));
    p.catch(() => cache.delete(src));
    cache.set(src, p);
  }
  return p;
}

export default function CanvasImage({
  src,
  alt = "",
  className = "",
  fit = "cover",
  onLoad,
  onError,
}: {
  src: string;
  alt?: string;
  className?: string;
  fit?: "cover" | "contain";
  onLoad?: () => void;
  onError?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  // වෙනත් site එකක photo එකක් (CORS නැති) canvas එකට ගන්න බැරි නම් — සාමාන්‍ය <img> එකකින් පෙන්නනවා (photo එක නොපේන්න නොවෙන්න)
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let alive = true;
    loadBitmap(src)
      .then((b) => { if (alive) { setBmp(b); setNatural({ w: b.width, h: b.height }); onLoad?.(); } })
      .catch(() => alive && setFallback(true));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Canvas එකේ ප්‍රමාණයට අනුව අඳිනවා (resize වුණාමත්)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !bmp) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      // contain mode එකේ size එක photo එකෙන්ම ගන්නවා
      const w = fit === "contain" ? bmp.width : Math.max(1, Math.round(rect.width * dpr));
      const h = fit === "contain" ? bmp.height : Math.max(1, Math.round(rect.height * dpr));
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      if (fit === "contain") { ctx.drawImage(bmp, 0, 0, w, h); return; }
      const scale = Math.max(w / bmp.width, h / bmp.height); // object-fit: cover
      const dw = bmp.width * scale, dh = bmp.height * scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bmp, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    draw();
    if (fit === "contain") return;
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [bmp, fit]);

  if (fallback) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} draggable={false} onLoad={() => onLoad?.()} onError={() => onError?.()} className={`${className} ${fit === "contain" ? "object-contain" : "object-cover"}`} />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      onContextMenu={(e) => e.preventDefault()}
      className={className}
      style={fit === "contain" && natural ? { aspectRatio: `${natural.w} / ${natural.h}` } : undefined}
    />
  );
}
