// lib/consent.ts
// 🍪 Cookie තේරීම (browser එකේ) — "සියල්ල" හෝ "අත්‍යවශ්‍ය ඒවා පමණක්".
// අනාගතයේදී Google Analytics / Facebook Pixel වගේ දෙයක් දානවා නම්, ඒක load කරන්න කලින් hasAnalyticsConsent() බලන්න.
export const CONSENT_KEY = "seneha_cookie_consent";
export const CONSENT_VERSION = 1; // 👈 Cookies policy එක වෙනස් කළොත් මේක වැඩි කරන්න — හැමෝගෙන්ම ආයේ අහනවා

export type Consent = { v: number; analytics: boolean; at: string };

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const c = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null") as Consent | null;
    return c && c.v === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean) {
  const c: Consent = { v: CONSENT_VERSION, analytics, at: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
  window.dispatchEvent(new CustomEvent("seneha-consent", { detail: c }));
}

export const hasAnalyticsConsent = () => readConsent()?.analytics === true;
