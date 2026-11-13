// components/LiveAlerts.tsx — 🔔 අලුත් කැමැත්තක් / අලුත් message එකක් ආපු ගමන් පොඩි notification එකක් (toast + chime)
// • Messages page එකේ ඉන්නකොට message toasts පෙන්නන්නේ නෑ (chat එකේම පේනවා)
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { playChime } from "@/lib/chime";

type Toast = { id: string; kind: "interest" | "message"; name: string; text?: string; href: string };

export default function LiveAlerts() {
  const { t } = useLang();
  const L = t.liveAlerts;
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => { pathRef.current = pathname; }, [pathname]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setUid(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid || pathRef.current?.startsWith("/admin")) return;
    const sb = createClient();
    const nameOf = async (id: string) => {
      const { data } = await sb.from("profiles").select("full_name").eq("id", id).maybeSingle();
      return String(data?.full_name ?? "").split(" ")[0] || L.someone;
    };
    const push = (toast: Toast) => {
      setToasts((list) => [toast, ...list].slice(0, 3));
      playChime();
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== toast.id)), 7000);
    };
    const ch = sb
      .channel(`live-alerts-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "interests", filter: `receiver_id=eq.${uid}` }, async (p) => {
        const row = p.new as { id: string; sender_id: string; status: string };
        if (row.status !== "pending") return;
        push({ id: `i-${row.id}`, kind: "interest", name: await nameOf(row.sender_id), href: "/interests" });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${uid}` }, async (p) => {
        if (pathRef.current?.startsWith("/chat")) return; // chat එකේ ඉන්නවා නම් ඕන නෑ
        const row = p.new as { id: string; sender_id: string; content: string; image_path?: string | null; audio_path?: string | null };
        const text = row.image_path ? "📷" : row.audio_path ? "🎤" : String(row.content ?? "").slice(0, 80);
        push({ id: `m-${row.id}`, kind: "message", name: await nameOf(row.sender_id), text, href: `/chat?userId=${row.sender_id}` });
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [uid, L.someone]);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[150] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-background/95 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-300">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${x.kind === "interest" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600"}`}>
            {x.kind === "interest" ? <Heart className="h-5 w-5 fill-current" /> : <MessageCircle className="h-5 w-5" />}
          </span>
          <Link href={x.href} onClick={() => setToasts((l) => l.filter((y) => y.id !== x.id))} className="min-w-0 flex-1">
            <p className="text-sm font-bold">{x.kind === "interest" ? L.interest.replace("{name}", x.name) : L.message.replace("{name}", x.name)}</p>
            <p className="truncate text-xs text-muted-foreground">{x.kind === "interest" ? L.interestSub : x.text}</p>
          </Link>
          <button onClick={() => setToasts((l) => l.filter((y) => y.id !== x.id))} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
