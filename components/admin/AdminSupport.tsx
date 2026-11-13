// components/admin/AdminSupport.tsx — 🛡️ Admin: පාරිභෝගික සහාය chats
"use client";

import { useEffect, useRef, useState } from "react";
import { Headset, Loader2, Send } from "lucide-react";
import { useOnlineUsers } from "@/lib/presence";
import { lastSeenText, parseTs } from "@/lib/last-seen";
import { useLang } from "@/components/providers";

type Thread = { user_id: string; last: string; last_at: string; unread: number; profile: { full_name: string | null; email: string | null; last_seen_at?: string | null; last_login_at?: string | null } | null };
type Msg = { id: string; sender: "user" | "admin"; content: string; created_at: string };

export default function AdminSupport() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const { t, lang } = useLang();
  const presence = useOnlineUsers(); // 🟢 Realtime online තත්ත්වය

  // 👇 "🟢 දැන් online" නැත්නම් "සක්‍රිය වූයේ X කට පෙර" (site එකේ අන්තිමට හිටපු / login වුණ වෙලාවෙන් අලුත්ම එක)
  const statusOf = (th: Thread) => {
    if (presence.online.has(th.user_id)) return { online: true, text: t.profile.onlineNow, title: "" };
    const latest = [th.profile?.last_seen_at, th.profile?.last_login_at, presence.leftAt.get(th.user_id)]
      .filter((x): x is string => !!x)
      .sort((a, b) => parseTs(a) - parseTs(b))
      .pop() ?? null;
    const s = lastSeenText(th.profile?.last_seen_at, lang, { onlineNow: t.profile.onlineNow, activeAgo: t.profile.activeAgo }, latest);
    const login = th.profile?.last_login_at ? new Date(parseTs(th.profile.last_login_at)).toLocaleString() : "";
    return s ? { ...s, title: login ? `Last login: ${login}` : "" } : null;
  };
  const renderStatus = (th: Thread, className = "") => {
    const s = statusOf(th);
    if (!s) return null;
    return (
      <span title={s.title} className={`flex items-center gap-1.5 text-xs ${s.online ? "font-semibold text-green-600 dark:text-green-400" : "text-muted-foreground"} ${className}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${s.online ? "bg-green-500" : "bg-muted-foreground/40"}`} />
        {s.text}
      </span>
    );
  };

  const loadThreads = () => fetch("/api/admin/support", { cache: "no-store" }).then((r) => r.json()).then((d) => setThreads(d.threads ?? []));
  const loadMsgs = (uid: string) => fetch(`/api/admin/support?userId=${uid}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setMsgs(d.messages ?? []));

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 15000); // තත්පර 15කට සැරයක් අලුත් messages බලනවා
    window.addEventListener("admin-data-changed", loadThreads); // ⚡ Realtime
    return () => { clearInterval(id); window.removeEventListener("admin-data-changed", loadThreads); };
  }, []);
  useEffect(() => {
    if (!active) return;
    loadMsgs(active);
    const id = setInterval(() => loadMsgs(active), 8000);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: active, content: text }) });
    setSending(false);
    if (res.ok) { const { message } = await res.json(); setMsgs((m) => [...m, message]); setText(""); loadThreads(); }
  };

  const unreadTotal = (threads ?? []).reduce((sum, th) => sum + th.unread, 0);
  const activeThread = threads?.find((th) => th.user_id === active) ?? null;

  return (
    <section className="mb-10 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Headset className="h-6 w-6 text-primary" /> Customer support {unreadTotal > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadTotal}</span>}</h2>
      <div className="mt-5 grid h-[28rem] overflow-hidden rounded-2xl border border-border md:grid-cols-[18rem_1fr]">
        <ul className="overflow-y-auto border-b border-border md:border-b-0 md:border-r custom-scrollbar">
          {threads === null ? <li className="p-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li> :
            threads.length === 0 ? <li className="p-6 text-center text-sm text-muted-foreground">No messages yet</li> :
            threads.map((th) => (
              <li key={th.user_id}>
                <button onClick={() => setActive(th.user_id)} className={`flex w-full items-start gap-2 border-b border-border/60 p-3 text-left hover:bg-muted/50 ${active === th.user_id ? "bg-primary/10" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{th.profile?.full_name || th.profile?.email || "User"}</p>
                    {renderStatus(th, "mt-0.5")}
                    <p className="mt-1 truncate text-xs text-muted-foreground">{th.last}</p>
                  </div>
                  {th.unread > 0 && <span className="rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{th.unread}</span>}
                </button>
              </li>
            ))}
        </ul>
        <div className="flex min-h-0 flex-col">
          {!active ? <p className="m-auto text-sm text-muted-foreground">Select a conversation</p> : (
            <>
              {/* 👇 තෝරපු user ගේ නම + online / අන්තිම සක්‍රිය වෙලාව */}
              {activeThread && (
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{activeThread.profile?.full_name || activeThread.profile?.email || "User"}</p>
                    {activeThread.profile?.full_name && activeThread.profile?.email && <p className="truncate text-xs text-muted-foreground">{activeThread.profile.email}</p>}
                  </div>
                  {renderStatus(activeThread, "shrink-0")}
                </div>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto p-4 custom-scrollbar">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <p className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${m.sender === "admin" ? "bg-primary text-white" : "bg-muted"}`}>{m.content}</p>
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply…" className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary" />
                <button disabled={sending} className="rounded-xl bg-primary px-4 text-white disabled:opacity-60">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
