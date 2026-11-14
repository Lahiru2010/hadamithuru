// lib/analytics.ts — 📊 update-65: Google Analytics (GA4) events — cookie consent එකේ "සියල්ල" තෝරලා නම් විතරයි
"use client";

type Gtag = (...args: unknown[]) => void;

/** උදා: track("send_interest") · track("contact_submit", { topic: "safety" }) */
export function track(name: string, params?: Record<string, unknown>) {
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof g === "function") g("event", name, params ?? {});
}
