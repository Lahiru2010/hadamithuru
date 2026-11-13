// components/SessionGuard.tsx
// "මාව මතක තබාගන්න" untick කරලා login වුණොත්, browser එක සම්පූර්ණයෙන්ම වහලා ආයේ open කළාම logout කරනවා.
// (Browser එක වහනකම් tabs කීයක් open කළත් login වෙලාම තියෙනවා — "session cookie" එකක් පාවිච්චි කරන නිසා)
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/client";

const FORGET_KEY = "seneha_forget_me";
const ALIVE_COOKIE = "seneha_alive";

/** Login වුණාම call කරන්න */
export function setRememberMe(remember: boolean) {
  if (remember) {
    localStorage.removeItem(FORGET_KEY);
  } else {
    localStorage.setItem(FORGET_KEY, "1");
    document.cookie = `${ALIVE_COOKIE}=1; path=/; SameSite=Lax`; // expiry නැති cookie → browser එක වහනකොට මැකෙනවා
  }
}

export default function SessionGuard() {
  useEffect(() => {
    if (localStorage.getItem(FORGET_KEY) !== "1") return;
    const alive = document.cookie.split("; ").some((c) => c.startsWith(`${ALIVE_COOKIE}=`));
    if (alive) return;
    // Browser එක වහලා ආයේ ආවා → logout
    localStorage.removeItem(FORGET_KEY);
    createClient().auth.signOut().then(() => window.location.replace("/login"));
  }, []);
  return null;
}
