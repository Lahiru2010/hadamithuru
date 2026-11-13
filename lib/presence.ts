// lib/presence.ts
// 🟢 Realtime "online" තත්ත්වය — Supabase Realtime Presence.
// Login වෙලා ඉන්න හැමෝම එකම channel එකකට "මම online" කියලා join වෙනවා (navbar එකෙන්).
// කෙනෙක් site එකට ආපු ගමන් / tab එක වහපු ගමන් අනිත් අයට ඒ ගමන්ම (refresh නැතුව) පේනවා.
"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/client";

let channel: RealtimeChannel | null = null;
let joinedAs: string | null = null;
let online = new Set<string>();
const leftAt = new Map<string, string>(); // offline වුණ වෙලාව (ඒ ගමන්ම "සක්‍රිය වූයේ දැන්" පෙන්නන්න)
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Navbar එකෙන් call කරනවා — login වුණාම join, logout වුණාම leave */
export function joinPresence(userId: string | null) {
  if (joinedAs === userId) return;
  const supabase = createClient();
  if (channel) { supabase.removeChannel(channel); channel = null; online = new Set(); emit(); }
  joinedAs = userId;
  if (!userId) return;

  channel = supabase.channel("online-users", { config: { presence: { key: userId } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const next = new Set(Object.keys(channel?.presenceState() ?? {}));
      for (const id of online) if (!next.has(id)) leftAt.set(id, new Date().toISOString());
      online = next;
      emit();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") await channel?.track({ at: new Date().toISOString() });
    });
}

/** දැන් online ඉන්න අය (Set) + offline වුණ වෙලාවල් */
export function useOnlineUsers() {
  const [, setV] = useState(0);
  useEffect(() => {
    const l = () => setV((x) => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return { online, leftAt };
}
