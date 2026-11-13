// components/AvatarImage.tsx
// රවුම් profile photo එකක්: load වෙනකම් shimmer loading animation එකක් පෙන්නලා,
// load වුණාම ලස්සනට fade-in වෙනවා. Photo එකක් නැත්නම් / කැඩිලා නම් default image එක.
// පාවිච්චි කරන විදිහ:  <AvatarImage src={url} alt="Name" className="w-12 h-12" />
// හතරැස් (රවුම් කොන්) photo එකකට:  <AvatarImage src={url} className="w-20 h-20" shape="rounded-3xl" />
"use client";
import CanvasImage from "@/components/CanvasImage";

import { useState } from "react";

const DEFAULT_PHOTO =
  "/images/default-avatar.svg";

type Props = {
  src?: string | null;
  alt?: string;
  /** Size එක දෙන්න, උදා: "w-12 h-12" */
  className?: string;
  /** Photo එකේ හැඩය. Default එක රවුම ("rounded-full"). උදා: "rounded-3xl" */
  shape?: string;
};

function AvatarImageInner({ src, alt = "", className = "w-10 h-10", shape = "rounded-full" }: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_PHOTO);
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`relative block shrink-0 overflow-hidden bg-muted ${shape} ${className}`}>
      {/* Shimmer animation එකේ keyframes (React එක මේක page එකට එක පාරයි දාන්නේ) */}
      <style href="avatar-image-shimmer" precedence="default">
        {`@keyframes avatarShimmer { 100% { transform: translateX(100%); } }`}
      </style>

      {!loaded && (
        <span className="absolute inset-0 overflow-hidden bg-muted">
          <span className="absolute inset-0 -translate-x-full animate-[avatarShimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </span>
      )}

      {/* 🔒 canvas එකක (Inspect Element එකෙන් img link එකක් ගන්න බෑ) */}
      <CanvasImage
        key={currentSrc}
        src={currentSrc}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (currentSrc !== DEFAULT_PHOTO) setCurrentSrc(DEFAULT_PHOTO);
          else setLoaded(true);
        }}
        className={`block h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}

// src එක වෙනස් වුණාම (වෙන කෙනෙක්ගේ chat එක open කළාම වගේ) loading state එක reset වෙන්න key එකක් දානවා
export default function AvatarImage(props: Props) {
  return <AvatarImageInner key={props.src ?? "default"} {...props} />;
}
