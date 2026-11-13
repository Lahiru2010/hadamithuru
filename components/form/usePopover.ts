// components/form/usePopover.ts
// Popover (dropdown) එකක් පිටතින් click කළාම / Esc ඔබපුවාම වහන්න
"use client";

import { useEffect, useRef, useState } from "react";

export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

/** App language → browser locale (මාස / දවස් නම් වලට) */
export const localeFor = (lang: string) => (lang === "si" ? "si-LK" : lang === "ta" ? "ta-LK" : "en-GB");

export const fieldButtonClass = (invalid?: boolean) =>
  `flex w-full items-center justify-between gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/20 ${
    invalid ? "border-red-500" : "border-border hover:border-primary/50 focus-visible:border-primary"
  }`;
