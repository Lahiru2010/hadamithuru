// lib/favicon-badge.ts — 🔵 update-68: අලුත් notification / message එකක් තියෙද්දී browser tab එකේ favicon එකට නිල් තිතක් + title එකට (n)
// Logo එක රතු / රෝස නිසා තිත නිල් (#2563EB) — සුදු වටයක් එක්ක, light / dark tab දෙකේම පැහැදිලියි.
"use client";

const DOT = "#2563EB";
const sources = new Map<string, number>();
let originals: { el: HTMLLinkElement; href: string; type: string }[] | null = null;
let badged: string | null = null; // හදපු data URL එක (cache)
let lastTotal = 0;

const iconLinks = () => Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));

function drawBadge(): Promise<string> {
  if (badged) return Promise.resolve(badged);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 64;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve("");
      ctx.drawImage(img, 0, 0, size, size);
      // 🔵 දකුණු පැත්තේ උඩ — සුදු වටය + නිල් තිත
      ctx.beginPath();
      ctx.arc(size - 15, 15, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size - 15, 15, 10.5, 0, Math.PI * 2);
      ctx.fillStyle = DOT;
      ctx.fill();
      badged = c.toDataURL("image/png");
      resolve(badged);
    };
    img.onerror = () => resolve("");
    img.src = "/icon.svg";
  });
}

function applyTitle() {
  const norm = (x: string) => x.replace(/\s+/g, " ").trim(); // browser එක title එකේ හිස්තැන් වෙනස් කරනවා — සසඳන්නේ normalize කරලා
  const base = norm(document.title.replace(/^\(\d+\+?\)\s*/, ""));
  const want = norm(lastTotal > 0 ? `(${lastTotal > 9 ? "9+" : lastTotal}) ${base}` : base);
  if (norm(document.title) !== want) document.title = want;
}

function applyIcons() {
  if (!originals) return;
  for (const o of originals) {
    const href = lastTotal > 0 && badged ? badged : o.href;
    const type = lastTotal > 0 && badged ? "image/png" : o.type;
    if (o.el.href !== href) o.el.href = href;
    if (o.el.type !== type) o.el.type = type;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

async function render() {
  if (typeof document === "undefined") return;
  lastTotal = Math.max(0, ...Array.from(sources.values())); // 👈 එකම message එක bell එකෙනුත් ගණන් වෙන නිසා එකතුව නෙවෙයි, ලොකුම ගණන
  if (!originals) originals = iconLinks().map((el) => ({ el, href: el.href, type: el.type }));
  if (lastTotal > 0) await drawBadge();
  applyIcons();
  applyTitle();
  // 📄 Page එක මාරු වුණාම Next.js title / icon එක අලුතෙන් දානවා — තත්පර 2න් 2ට ආපහු බලනවා (unread තියෙද්දී විතරයි)
  if (lastTotal > 0 && !timer) timer = setInterval(() => { applyIcons(); applyTitle(); }, 2000);
  if (lastTotal === 0 && timer) { clearInterval(timer); timer = null; }
}

/** key එකකින් unread ගණනක් දානවා (උදා: "bell", "messages", "interests") — එකක් හරි 0 ට වැඩි නම් තිත */
export function setFaviconBadge(key: string, count: number) {
  const prev = sources.get(key) ?? 0;
  if (prev === count) return;
  sources.set(key, Math.max(0, count));
  void render();
}
