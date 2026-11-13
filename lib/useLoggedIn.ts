// lib/useLoggedIn.ts — 🔐 දැන් login වෙලාද (null = තාම දන්නේ නෑ — load වෙනකම් කිසිවක් පෙන්නන්න එපා)
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setLoggedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);
  return loggedIn;
}
