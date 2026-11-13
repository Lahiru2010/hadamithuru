// components/FaviconBadge.tsx
// 🔔 අලුත් message එකක් ආවම browser tab එකේ favicon එකේ රතු ගණනක් + title එකේ "(2)" — වෙන tab එකක ඉන්නකොටත් පේනවා.
// Navbar එකෙන් "seneha-unread" event එක (ගණන) එවනවා.
"use client";

import { useEffect, useRef } from "react";

const BASE_ICON = "/icon.svg";
const PREFIX = /^\(\d+\+?\)\s/;

export default function FaviconBadge() {
  const count = useRef(0);
  const img = useRef<HTMLImageElement | null>(null);
  const original = useRef<{ el: HTMLLinkElement; href: string }[] | null>(null);

  useEffect(() => {
    // 👇 Tab title එකේ "(n) " — Next.js page මාරු කරනකොට title එක වෙනස් කරන නිසා ආයේ දානවා
    const applyTitle = () => {
      const clean = document.title.replace(PREFIX, "");
      const next = count.current > 0 ? `(${count.current > 9 ? "9+" : count.current}) ${clean}` : clean;
      if (document.title !== next) document.title = next;
    };

    const draw = () => {
      const links = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
      if (!original.current) original.current = links.map((el) => ({ el, href: el.href }));
      if (count.current <= 0) {
        original.current.forEach(({ el, href }) => { el.href = href; });
        return;
      }
      const paint = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        const ctx = c.getContext("2d");
        if (!ctx || !img.current) return;
        ctx.drawImage(img.current, 0, 0, 64, 64);
        // 🔴 දකුණු පැත්තේ උඩ රතු කවය + ගණන
        ctx.beginPath();
        ctx.arc(46, 18, 17, 0, Math.PI * 2);
        ctx.fillStyle = "#FF1F1F";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 22px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(count.current > 9 ? "9+" : String(count.current), 46, 19);
        const url = c.toDataURL("image/png");
        original.current?.forEach(({ el }) => { el.href = url; });
      };
      if (img.current?.complete) paint();
      else {
        img.current = new Image();
        img.current.onload = paint;
        img.current.src = BASE_ICON;
      }
    };

    const onUnread = (e: Event) => {
      count.current = Math.max(0, Number((e as CustomEvent<number>).detail) || 0);
      draw();
      applyTitle();
    };
    window.addEventListener("seneha-unread", onUnread);

    const titleEl = document.querySelector("title");
    const mo = titleEl ? new MutationObserver(applyTitle) : null;
    if (titleEl && mo) mo.observe(titleEl, { childList: true, characterData: true, subtree: true });

    return () => {
      window.removeEventListener("seneha-unread", onUnread);
      mo?.disconnect();
    };
  }, []);

  return null;
}
