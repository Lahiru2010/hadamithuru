// components/CardImage.tsx
// Profile card එකේ photo එක.
//  - Placeholder එකක් තියෙනවා නම්: ඒ photo එකේම පොඩි blur version එක ක්ෂණිකව පෙන්නලා,
//    ඇත්ත photo එක load වුණාම ඒ උඩින් ලස්සනට fade-in වෙනවා (Medium / Instagram වගේ "blur-up").
//  - Placeholder එකක් නැත්නම්: shimmer loading animation එකක්.
//  - Photo එක කැඩිලා නම් default image එක.
"use client";
import CanvasImage from "@/components/CanvasImage";

import { useState } from "react";

const DEFAULT_PHOTO =
  "/images/default-avatar.svg";

type Props = {
  src?: string | null;
  alt: string;
  /** Photo එකේ ඉතාම පොඩි version එක (data URL) — load වෙනකම් blur කරලා පෙන්නනවා */
  placeholder?: string | null;
  /** පළවෙනි cards ටිකට true දෙන්න — ඒවා ඉක්මනින්ම load වෙන්න පටන් ගන්නවා */
  priority?: boolean;
};

export default function CardImage({ src, alt, placeholder, priority = false }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_PHOTO);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted">
      {/* Shimmer animation එකේ keyframes (React එක මේක page එකට එක පාරයි දාන්නේ) */}
      <style href="card-image-shimmer" precedence="default">
        {`@keyframes shimmer { 100% { transform: translateX(100%); } }`}
      </style>

      {/* 👇 Blur placeholder (photo එකේම පොඩි version එක) */}
      {placeholder && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-opacity duration-700 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* 👇 Placeholder එකක් නැත්නම් shimmer animation එක */}
      {!placeholder && !loaded && (
        <div className="absolute inset-0 overflow-hidden bg-muted">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-foreground/10" fill="currentColor" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 6v1h16v-1c0-3.33-2.67-6-8-6Z" />
            </svg>
          </div>
        </div>
      )}

      {/* 👇 🔒 Photo එක canvas එකක (Inspect Element එකෙන් img link එකක් ගන්න බෑ) */}
      <CanvasImage
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== DEFAULT_PHOTO) setCurrentSrc(DEFAULT_PHOTO);
          else setLoaded(true);
        }}
        className={`relative block h-full w-full transition-all duration-700 group-hover:scale-105 ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      />
    </div>
  );
}
