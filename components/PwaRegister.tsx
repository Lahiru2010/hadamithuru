// components/PwaRegister.tsx — 📱 Service worker register කරනවා + "App එක install කරන්න" prompt එක navbar එකට දෙනවා
"use client";

import { useEffect } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window { __senehaInstall?: InstallEvent | null }
}

export async function promptInstall() {
  const e = window.__senehaInstall;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  window.__senehaInstall = null;
  window.dispatchEvent(new Event("seneha-installable"));
  return outcome === "accepted";
}

export default function PwaRegister() {
  useEffect(() => {
    // 👇 Production එකේ විතරයි (dev එකේ service worker එක cache ප්‍රශ්න දෙනවා)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault(); // browser එකේ default banner එක වෙනුවට අපේ menu item එක
      window.__senehaInstall = e as InstallEvent;
      window.dispatchEvent(new Event("seneha-installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}
