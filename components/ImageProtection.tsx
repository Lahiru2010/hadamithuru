// components/ImageProtection.tsx
// 🔒 Site එකේ photos right-click කරලා "Save image" කරන්න, ඇදලා desktop එකට දාන්න, phone එකේ long-press කරලා save කරන්න බැරි කරනවා.
// (Screenshot එකක් ගන්න එක කිසිම website එකකට නවත්තන්න බෑ — ඒත් මේකෙන් ලේසියෙන් download කරන එක නවතිනවා.)
"use client";

import { useEffect } from "react";

export default function ImageProtection() {
  useEffect(() => {
    const block = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return (
    <style href="image-protection" precedence="default">
      {`img { -webkit-touch-callout: none; -webkit-user-drag: none; user-select: none; }`}
    </style>
  );
}
