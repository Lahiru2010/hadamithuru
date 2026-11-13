// components/chat/LastChatTime.tsx
// 💬 Chat list එකේ නමට යටින්: අන්තිමට chat කරපු වෙලාව ("විනාඩි 10කට පෙර" / "පැය 2කට පෙර" / "දින 3කට පෙර")
// Page එකේ අනිත් code එකෙන් වෙනම — server එකෙන් කෙලින්ම අරගන්නවා, අලුත් message ආවම / යැව්වම auto update වෙනවා.
"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/providers";
import { parseTs, timeAgo } from "@/lib/last-seen";
import { createClient } from "@/lib/client";

let timesPromise: Promise<Record<string, string>> | null = null;

// 👇 "New message" count එක ගන්න query එකේ විදිහටම (හොඳින් වැඩ කරන "eq" filters 2ක්):
//    මම යවපු messages + මට ආපු messages — එක් එක් කෙනා එක්ක අන්තිම එකේ වෙලාව
function loadTimes() {
  if (!timesPromise) {
    timesPromise = (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};
      const [sent, received] = await Promise.all([
        supabase.from("messages").select("receiver_id, created_at").eq("sender_id", user.id).order("created_at", { ascending: false }).limit(1000),
        supabase.from("messages").select("sender_id, created_at").eq("receiver_id", user.id).order("created_at", { ascending: false }).limit(1000),
      ]);
      if (sent.error) console.warn("[chat] sent messages:", sent.error.message);
      if (received.error) console.warn("[chat] received messages:", received.error.message);
      const times: Record<string, string> = {};
      const keep = (other: string, at: string) => {
        if (!other || !at) return;
        if (!times[other] || parseTs(at) > parseTs(times[other])) times[other] = at;
      };
      for (const m of sent.data ?? []) keep(m.receiver_id, m.created_at);
      for (const m of received.data ?? []) keep(m.sender_id, m.created_at);
      console.info("[chat] last message times:", times);
      return times;
    })().catch((e) => {
      console.warn("[chat] last-times failed:", e);
      timesPromise = null;
      return {};
    });
  }
  return timesPromise;
}
/** Chat page එකෙන් call කරන්න — page එකට ආවම / reload කළාම අලුත් දත්ත */
export function refreshChatTimes() { timesPromise = null; }

export default function LastChatTime({ otherId, unread = false }: { otherId: string; unread?: boolean }) {
  const { t, lang } = useLang();
  const [at, setAt] = useState<string | null | undefined>(undefined); // undefined = load වෙමින්
  const [, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    loadTimes().then((times) => { if (alive) setAt(times[otherId] ?? null); });
    // අලුත් message එකක් යැව්වම / ආවම
    const onNew = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; at: string }>).detail;
      if (d?.id === otherId && d.at) setAt(d.at);
    };
    window.addEventListener("chat-last-time", onNew);
    const tick = setInterval(() => setTick((x) => x + 1), 60_000); // විනාඩියකට සැරයක් "X කට පෙර" update
    return () => { alive = false; window.removeEventListener("chat-last-time", onNew); clearInterval(tick); };
  }, [otherId]);

  if (at === undefined) return <span className="mt-1 block h-3 w-16 animate-pulse rounded bg-muted" />;
  // 👇 අලුත් (නොකියවපු) message එකක් නම් "New message!" (රතු), නැත්නම් අන්තිමට chat කරපු වෙලාව
  if (unread) return <span className="block truncate text-xs font-semibold text-red-500">{t.extra.newMessage}{at ? ` · ${timeAgo(at, lang, t.extra.justNow)}` : ""}</span>;
  return (
    <span className="block truncate text-xs text-muted-foreground">
      {at ? timeAgo(at, lang, t.extra.justNow) : t.extra.noMessagesYet}
    </span>
  );
}
