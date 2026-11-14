// app/contact/page.tsx
// 📮 update-59: අප අමතන්න — form එකක් (login නැති අයටත්). පණිවිඩ admin panel → "Contact form" tab එකට යනවා.
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Loader2, LifeBuoy, Mail, MessageCircle, Send, ShieldAlert } from "lucide-react";
import { useLang } from "@/components/providers";
import { useMyProfile } from "@/lib/useMyProfile";
import { authButtonClass, authInputClass } from "@/components/AuthCard";
import Dropdown from "@/components/ui/Dropdown";

const TOPICS = ["general", "account", "payment", "safety", "feedback", "other"] as const;
type Topic = (typeof TOPICS)[number];

export default function ContactPage() {
  const { t, lang } = useLang();
  const C = t.contactPage;
  const me = useMyProfile(); // 👤 Login වෙලා නම් නම / email ඉබේම පිරෙනවා

  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "general" as Topic, message: "", website: "" });
  const [touched, setTouched] = useState({ name: false, email: false });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  // 👇 User type කරලා නැත්නම් profile එකේ නම / email
  const name = touched.name ? form.name : form.name || String(me?.full_name ?? "");
  const email = touched.email ? form.email : form.email || String(me?.email ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) || form.message.trim().length < 10) {
      setError(C.invalid);
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name, email, lang }),
      });
      if (res.ok) {
        setState("sent");
        setForm((f) => ({ ...f, message: "", phone: "" }));
        return;
      }
      const d = await res.json().catch(() => ({}));
      setError(d.error === "too_many" ? C.tooMany : d.error === "invalid" ? C.invalid : C.error);
    } catch {
      setError(C.error);
    }
    setState("idle");
  };

  const contactEmail = t.aboutPage.contactEmail;
  const label = "mb-1.5 block text-sm font-semibold text-foreground";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 blur-[140px] dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:py-16">
        {/* Hero */}
        <header className="text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/15 sm:h-20 sm:w-20">
            <Mail className="h-8 w-8 sm:h-10 sm:w-10" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{C.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{C.subtitle}</p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* ℹ️ වම් පැත්ත: වෙනත් ක්‍රම */}
          <aside className="order-2 space-y-4 lg:order-1">
            <a href={`mailto:${contactEmail}`} className="flex items-start gap-4 rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur transition hover:border-primary/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block font-bold text-foreground">{C.emailUs}</span>
                <span className="block break-all font-semibold text-primary">{contactEmail}</span>
              </span>
            </a>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-foreground">{C.replyTime}</span>
                <span className="block text-sm text-muted-foreground">{C.replyTimeText}</span>
              </span>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="h-5 w-5" /></span>
              <span>
                <span className="block font-bold text-foreground">{C.liveChat}</span>
                <span className="block text-sm text-muted-foreground">{C.liveChatText}</span>
              </span>
            </div>
            <Link href="/help" className="group flex items-start gap-4 rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur transition hover:border-primary/40">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><LifeBuoy className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-foreground">{C.faq}</span>
                <span className="block text-sm text-muted-foreground">{C.faqText}</span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
            <p className="flex items-start gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {C.safetyNote}
            </p>
          </aside>

          {/* 📝 දකුණු පැත්ත: form එක */}
          <section className="order-1 rounded-[2rem] border border-border bg-background p-5 shadow-xl shadow-primary/5 sm:p-8 lg:order-2">
            {state === "sent" ? (
              <div role="status" className="flex flex-col items-center py-10 text-center animate-in fade-in">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h2 className="mt-4 text-2xl font-bold text-foreground">{C.sentTitle}</h2>
                <p className="mt-2 max-w-sm text-muted-foreground">{C.sentText}</p>
                <button type="button" onClick={() => setState("idle")} className="mt-6 rounded-xl border border-border px-5 py-2.5 font-semibold transition hover:border-primary/50 hover:text-primary">{C.sendAnother}</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-name" className={label}>{C.name} *</label>
                    <input id="c-name" autoComplete="name" required maxLength={80} value={name} onChange={(e) => { setTouched((x) => ({ ...x, name: true })); setForm((f) => ({ ...f, name: e.target.value })); }} className={authInputClass} />
                  </div>
                  <div>
                    <label htmlFor="c-email" className={label}>{C.email} *</label>
                    <input id="c-email" type="email" inputMode="email" autoComplete="email" required maxLength={160} value={email} onChange={(e) => { setTouched((x) => ({ ...x, email: true })); setForm((f) => ({ ...f, email: e.target.value })); }} className={authInputClass} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-phone" className={label}>{C.phone}</label>
                    <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={authInputClass} />
                  </div>
                  <div>
                    <span className={label}>{C.topic}</span>
                    <Dropdown
                      value={form.topic}
                      onChange={(v) => setForm((f) => ({ ...f, topic: v as Topic }))}
                      ariaLabel={C.topic}
                      fullWidth
                      buttonClassName="py-3"
                      options={TOPICS.map((k) => ({ value: k, label: C.topics[k] }))}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-msg" className={label}>{C.message} *</label>
                  <textarea id="c-msg" required rows={6} maxLength={3000} placeholder={C.messagePh} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className={`${authInputClass} resize-y`} />
                  <p className="mt-1 text-right text-xs text-muted-foreground">{form.message.length}/3000</p>
                </div>
                {/* 🤖 Bot අල්ලන හැංගුණු field එක (මිනිස්සුන්ට පේන්නේ නෑ) */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />

                {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

                <button type="submit" disabled={state === "sending"} className={authButtonClass}>
                  {state === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" /> {C.sending}</> : <><Send className="h-5 w-5" /> {C.send}</>}
                </button>
                <p className="text-center text-xs text-muted-foreground">{C.privacy}</p>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
