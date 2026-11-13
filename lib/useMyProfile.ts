// lib/useMyProfile.ts
// Login වෙලා ඉන්න user ගේ profile එක (match % ගණනයට). එක පාරක් ගත්තම memory එකේ තියාගන්නවා.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";


type Row = Record<string, unknown>;
let cache: Row | null | undefined; // undefined = තාම ගත්තේ නෑ
let pending: Promise<Row | null> | null = null;

// 👇 Account එක මාරු වුණාම (logout / වෙන account එකකින් login) පරණ profile එක cache එකෙන් අයින් කරනවා
if (typeof window !== "undefined") {
  createClient().auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      cache = undefined;
      pending = null;
    }
  });
}

function load(): Promise<Row | null> {
  if (!pending) {
    pending = (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(); // 👈 "*" — partner_prefs column එක නැතත් කැඩෙන්නේ නෑ
      return (data as Row | null) ?? null;
    })().then((row) => (cache = row));
  }
  return pending;
}

export function useMyProfile(initial?: Row | null) {
  const [me, setMe] = useState<Row | null>(initial ?? cache ?? null);
  useEffect(() => {
    if (initial) { cache = initial; return; }
    let active = true;
    load().then((row) => { if (active) setMe(row); });
    // Profile එක වෙනස් කළාම ආයේ ගන්නවා
    const refresh = () => { pending = null; cache = undefined; load().then((row) => active && setMe(row)); };
    window.addEventListener("profile-updated", refresh);
    return () => { active = false; window.removeEventListener("profile-updated", refresh); };
  }, [initial]);
  return me;
}
