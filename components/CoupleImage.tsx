// components/CoupleImage.tsx
// Home page එකේ couple photos. Photo එක තාම public/images/couples/ එකට දාලා නැත්නම් ලස්සන gradient placeholder එකක්.
// ⚡ update-25: next/image — MB 1-2ක photos browser එකට එන්නේ අවශ්‍ය size එකට කපලා, AVIF/WebP විදිහට (KB 50-150)
"use client";

import Image from "next/image";
import { useState } from "react";
import { HeartHandshake } from "lucide-react";

export default function CoupleImage({ src, alt, className = "", sizes = "(max-width: 768px) 70vw, 420px", priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 dark:from-rose-900/60 dark:via-pink-900/40 dark:to-orange-900/40 ${className}`} role="img" aria-label={alt}>
        <HeartHandshake className="h-1/3 w-1/3 max-h-16 max-w-16 text-[#D52047]/70" />
      </div>
    );
  }
  // 👇 className එකේ absolute නැත්නම් relative (fill image එකට parent එක position කරලා තියෙන්න ඕනේ)
  const positioned = /\b(absolute|fixed|relative|sticky)\b/.test(className) ? "" : "relative";
  return (
    <div className={`overflow-hidden ${positioned} ${className}`}>
      {/* 👇 ඇත්ත success story photos (Supabase signed link) — දැනටමත් පොඩි කරලා නිසා optimize කරන්නේ නෑ */}
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} quality={70} unoptimized={/^https?:\/\//.test(src)} onError={() => setFailed(true)} className="object-cover" />
    </div>
  );
}
