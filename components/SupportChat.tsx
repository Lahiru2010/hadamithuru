// components/SupportChat.tsx
// 💬 පාරිභෝගික සහාය — හැම page එකකම පහළ දකුණු කෙළවරේ (login වෙලා ඉන්න අයට).
// Messages යන්නේ admin ට විතරයි (Admin dashboard → Customer support). Admin පිළිතුර ඒ ගමන්ම මෙතන පේනවා.
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Headset, Loader2, Send, X, Lock } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { playChime } from "@/lib/chime";

type Msg = { id: string; sender: "user" | "admin"; content: string; created_at: string };


export default function SupportChat() {
  const { t } = useLang();
  const E = t.extra;
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const [toast, setToast] = useState(false); // 👈 "පාරිභෝගික සහාය ඔබට පිළිතුරු දුන්නා" පොඩි message එක
  const bottom = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Messages load + realtime (admin පිළිතුරු ඒ ගමන්ම)
  useEffect(() => {
    if (!userId) return;
    supabase.from("support_messages").select("id, sender, content, created_at").eq("user_id", userId).order("created_at").then(({ data }) => {
      const list = (data as Msg[]) ?? [];
      setMsgs(list);
      // 👇 Page එක reload කළත්: අන්තිමට බැලුවට පස්සේ admin පිළිතුරක් ආවා නම් රතු තිත
      const seenAt = localStorage.getItem("seneha_support_seen_at") ?? "";
      if (list.some((m) => m.sender === "admin" && m.created_at > seenAt)) { setUnread(true); setToast(true); }
    });
    const ch = supabase
      .channel(`support_${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${userId}` }, (p) => {
        const m = p.new as Msg;
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        if (m.sender === "admin") {
          setUnread(true);
          setToast(true);
          playChime(); // 🔔 පොඩි notification sound එකක්
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, supabase]);

  useEffect(() => {
    if (!open) return;
    setUnread(false);
    setToast(false);
    localStorage.setItem("seneha_support_seen_at", new Date().toISOString());
    bottom.current?.scrollIntoView({ block: "end" });
  }, [open, msgs]);

  // Login නැත්නම්, chat / admin pages වල පෙන්නන්නේ නෑ
  // Login නැත්නම් / admin page එකේ පෙන්නන්නේ නෑ
  if (!userId || pathname?.startsWith("/admin")) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const { data, error } = await supabase.from("support_messages").insert({ user_id: userId, sender: "user", content }).select("id, sender, content, created_at").single();
    setSending(false);
    if (!error && data) { setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as Msg])); setText(""); }
  };

  return (
    // 👇 හැම page එකකම එකම තැන (දකුණු පැත්තේ යට). Messages page එකේ send button එක වහන්නේ නැති වෙන්න
    //    ඉඩ තියලා තියෙන්නේ chat page එකේ message box එකේ (app/chat/page.tsx).
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#D61F55] to-[#F0544F] p-4 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Headset className="h-5 w-5" /></span>
            <div className="flex-1">
              <p className="font-bold">{E.supportTitle}</p>
              <p className="flex items-center gap-1 text-xs text-white/85"><Lock className="h-3 w-3" /> {E.supportNote}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4 custom-scrollbar">
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-background px-4 py-2.5 text-sm shadow-sm">{E.supportHello}</p>
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm shadow-sm ${m.sender === "user" ? "rounded-br-sm bg-gradient-to-r from-[#D61F55] to-[#F0544F] text-white" : "rounded-bl-sm bg-background"}`}>{m.content}</p>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={E.supportPlaceholder} className="min-w-0 flex-1 rounded-full border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary" />
            <button disabled={sending || !text.trim()} aria-label="Send" className="rounded-full bg-gradient-to-r from-[#D61F55] to-[#F0544F] p-2.5 text-white disabled:opacity-50">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
          </form>
        </div>
      )}
      {/* 👇 අලුත් පිළිතුරක් ආවම පොඩි message එකක් (button එකට උඩින්) */}
      {toast && !open && (
        <div className="flex max-w-[16rem] items-start gap-2 rounded-2xl border border-border bg-background p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <button onClick={() => setOpen(true)} className="flex-1 text-left text-sm font-semibold hover:text-primary">{E.supportReplied}</button>
          <button onClick={() => setToast(false)} aria-label="Dismiss" className="rounded-full p-0.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={E.supportOpen}
        title={E.supportOpen}
        style={{ backgroundColor: "#D61F55" }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#D61F55] to-[#F0544F] text-white shadow-xl shadow-primary/30 transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
        {unread && !open && (
          <span className="absolute right-0 top-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-red-500" />
          </span>
        )}
      </button>
    </div>
  );
}
