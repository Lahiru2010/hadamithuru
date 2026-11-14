// app/invite/page.tsx — 🎁 යාළුවන්ට ආරාධනා කරන්න (Refer a friend)
"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, Loader2, MessageCircle, Users } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";

export default function InvitePage() {
  const { t } = useLang();
  const I = t.invite;
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ joined: 0, months: 0 });

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (uid) {
        const [{ data: p }, { data: refs }] = await Promise.all([
          sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
          sb.from("referrals").select("referred_id, referrer_reward_months").eq("referrer_id", uid),
        ]);
        setCode((p?.referral_code as string | undefined) ?? null);
        setStats({ joined: refs?.length ?? 0, months: (refs ?? []).reduce((s, r) => s + (r.referrer_reward_months ?? 0), 0) });
      }
      setLoading(false);
    });
  }, []);

  const link = code && typeof window !== "undefined" ? `${window.location.origin}/register?ref=${code}` : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard නැති browsers */ }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#D52047] to-[#AD032A] p-8 text-white shadow-xl shadow-primary/20 md:p-12">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20"><Gift className="h-7 w-7" /></span>
          <h1 className="relative mt-5 text-3xl font-extrabold md:text-4xl">{I.title}</h1>
          <p className="relative mt-3 max-w-2xl text-white/85">{I.subtitle}</p>

          <div className="relative mt-8 rounded-2xl bg-white p-4 text-foreground shadow-lg dark:bg-[#1a0b11]">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{I.yourLink}</p>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : !code ? (
              <p className="text-sm text-amber-600">{I.noCode}</p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-4 py-3 font-mono text-sm outline-none" />
                <button type="button" onClick={copy} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? I.copied : I.copy}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${I.shareText} ${link}`)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
                  <MessageCircle className="h-4 w-4" /> {I.whatsapp}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, n: stats.joined, label: I.statsJoined },
              { icon: Gift, n: stats.months, label: I.statsRewarded },
            ].map(({ icon: Icon, n, label }) => (
              <div key={label} className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-3 text-3xl font-extrabold">{n}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <h2 className="mb-3 font-bold">{I.rulesTitle}</h2>
            <ol className="space-y-2.5 text-sm text-muted-foreground">
              {[I.rule1, I.rule2, I.rule3, I.rule4].map((r, i) => (
                <li key={r} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span> {r}</li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
