// components/admin/AdminContact.tsx — 🛡️ Admin: "අප අමතන්න" form පණිවිඩ (update-59)
"use client";

import { useEffect, useState } from "react";
import { Check, CheckCheck, Loader2, Mail, MailOpen, Phone, RotateCcw } from "lucide-react";

type Msg = { id: string; name: string; email: string; phone: string | null; topic: string; message: string; user_id: string | null; lang: string | null; status: "new" | "read" | "done"; created_at: string };

const TOPIC: Record<string, string> = { general: "General", account: "Account / login", payment: "Plans / payments", safety: "Safety", feedback: "Feedback", other: "Other" };
const FILTERS = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
] as const;

export default function AdminContact() {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("open");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetch("/api/admin/contact", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setMsgs(d.messages ?? []); setError(d.error ?? null); })
      .catch(() => setMsgs([]));

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const setStatus = async (id: string, status: Msg["status"]) => {
    setBusy(id);
    setMsgs((list) => list?.map((m) => (m.id === id ? { ...m, status } : m)) ?? null);
    await fetch("/api/admin/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setBusy(null);
    window.dispatchEvent(new Event("admin-data-changed")); // 👈 tab එකේ ගණන update වෙන්න
  };

  const shown = (msgs ?? []).filter((m) => (filter === "all" ? true : filter === "done" ? m.status === "done" : m.status !== "done"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Mail className="h-5 w-5 text-primary" /> Contact form messages</h2>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${filter === f.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Table එක නෑ වගේ — <code>20261201_contact_messages.sql</code> එක Supabase SQL Editor එකේ run කරන්න. ({error})
        </p>
      )}

      {msgs === null ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">No messages here.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-background p-4 shadow-sm sm:p-5 ${m.status === "new" ? "border-primary/50 ring-1 ring-primary/15" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {m.name}
                    {m.status === "new" && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                    {m.user_id && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700 dark:text-green-400">Member</span>}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{TOPIC[m.topic] ?? m.topic}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Hadamithuru – " + (TOPIC[m.topic] ?? "Message"))}`} className="font-semibold text-primary hover:underline">{m.email}</a>
                    {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3.5 w-3.5" /> {m.phone}</a>}
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {m.status === "new" && (
                    <button disabled={busy === m.id} onClick={() => setStatus(m.id, "read")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-primary/50 hover:text-primary"><MailOpen className="h-4 w-4" /> Read</button>
                  )}
                  {m.status !== "done" ? (
                    <button disabled={busy === m.id} onClick={() => setStatus(m.id, "done")} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"><CheckCheck className="h-4 w-4" /> Done</button>
                  ) : (
                    <button disabled={busy === m.id} onClick={() => setStatus(m.id, "read")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><RotateCcw className="h-4 w-4" /> Reopen</button>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line break-words rounded-xl bg-muted/40 p-3 text-sm leading-relaxed">{m.message}</p>
              {m.status === "done" && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-600"><Check className="h-3.5 w-3.5" /> Done</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
