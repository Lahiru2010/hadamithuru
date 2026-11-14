// components/admin/AdminPricing.tsx — 🛡️ Admin: 💰 පැකේජ මිල / පහසුකම් + ⚡ Boost මිල / දින + Boost ඉල්ලීම්
"use client";

import { useEffect, useState } from "react";
import { Check, Crown, ExternalLink, Gem, Heart, Loader2, RotateCcw, Save, Sparkles, Star, X, Zap } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { useLang } from "@/components/providers";
import { createClient } from "@/lib/client";
import { DEFAULT_PRICING, FEATURE_KEYS, normalizePricing, periodPrice, type Pricing } from "@/lib/pricing";
import BoostProgress from "@/components/BoostProgress";

type Req = { id: string; user_id: string; days: number; price_lkr: number; status: string; created_at: string; profile: { full_name: string; email: string; boosted_until: string | null } | null; phone: string | null };

export default function AdminPricing() {
  const { t } = useLang();
  const P = t.plans;
  const { showAlert, showConfirm } = useDialog();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [sub, setSub] = useState<"plans" | "premium" | "boosts">("plans"); // 🗂️ sub tab
  const [saved, setSaved] = useState<string>(""); // 👈 අන්තිමට save කරපු අගය (unsaved changes බලන්න)
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"pending" | "active" | "rejected">("pending");
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [manual, setManual] = useState({ email: "", days: "7" });
  const [busy, setBusy] = useState<string | null>(null);
  const [live, setLive] = useState<{ id: string; full_name: string; email: string; boosted_until: string; started_at: string }[] | null>(null);
  const [premium, setPremium] = useState<{ id: string; full_name: string; email: string; premium_until: string; founding_member: boolean; founding_number: number | null; reason: string | null; started_at: string | null }[] | null>(null);
  const [grant, setGrant] = useState({ email: "", months: "1" });
  const loadPremium = () => fetch("/api/admin/premium", { cache: "no-store" }).then((r) => r.json()).then((d) => setPremium(d.members ?? [])).catch(() => setPremium([]));
  const loadLive = () => fetch("/api/admin/boosts?view=live", { cache: "no-store" }).then((r) => r.json()).then((d) => setLive(d.live ?? [])).catch(() => setLive([]));

  useEffect(() => {
    Promise.resolve(createClient().from("app_settings").select("value").eq("key", "pricing").maybeSingle())
      .then(({ data }) => { const v = normalizePricing(data?.value); setPricing(v); setSaved(JSON.stringify(v)); })
      .catch(() => { setPricing(DEFAULT_PRICING); setSaved(JSON.stringify(DEFAULT_PRICING)); });
  }, []);
  const loadReqs = (s = tab) => fetch(`/api/admin/boosts?status=${s}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setReqs(d.requests ?? [])).catch(() => setReqs([]));
  useEffect(() => {
    loadReqs(tab);
    loadLive();
    loadPremium();
    const on = () => { loadReqs(tab); loadLive(); loadPremium(); };
    window.addEventListener("admin-data-changed", on);
    return () => window.removeEventListener("admin-data-changed", on);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // 👇 වෙනස්කම් save කරලා නැත්නම් යට bar එකක් පේනවා
  const dirty = !!pricing && !!saved && JSON.stringify(pricing) !== saved;

  const persist = async (value: Pricing, okMsg: string) => {
    setSaving(true);
    const res = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    setSaving(false);
    const d = await res.json().catch(() => null);
    if (!res.ok) return showAlert({ title: "Couldn't save", message: d?.error, tone: "error" });
    const v = normalizePricing(d.value);
    setPricing(v);
    setSaved(JSON.stringify(v));
    showAlert({ title: okMsg, tone: "success" });
  };
  const save = () => pricing && persist(pricing, "Pricing saved — live on the Plans page");
  const resetDefaults = async () => {
    const ok = await showConfirm({ title: "Reset all pricing to defaults?", message: "Plans, features and boost settings go back to the original values and go live immediately.", confirmText: "Reset", tone: "danger" });
    if (ok) persist(DEFAULT_PRICING, "Pricing reset to defaults");
  };

  const act = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    const res = await fetch("/api/admin/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    const d = await res.json().catch(() => null);
    if (!res.ok) return showAlert({ title: "Something went wrong", message: d?.error, tone: "error" });
    if (body.action === "manual") { setManual({ email: "", days: "7" }); showAlert({ title: `Boosted until ${new Date(d.until).toLocaleString()}`, tone: "success" }); }
    loadReqs(tab);
    loadLive();
  };

  const setPlan = (i: number, patch: Partial<Pricing["plans"][number]>) => setPricing((p) => p && { ...p, plans: p.plans.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const THEME: Record<string, { icon: typeof Heart }> = { free: { icon: Heart }, gold: { icon: Crown }, platinum: { icon: Gem } };
  const seg = (active: boolean) => `rounded-lg px-3 py-1.5 text-xs font-bold transition ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <div className="space-y-6 pb-20">
      {/* 🗂️ Sub tabs — එක වෙලාවකට එක කොටසක් (scroll අඩුයි) */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-background p-1.5 shadow-sm">
        {([["plans", "Plans & boost price", Sparkles], ["premium", `Premium members${premium ? ` (${premium.length})` : ""}`, Crown], ["boosts", `Boosts${live ? ` (${live.length})` : ""}`, Zap]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setSub(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${sub === id ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted"}`}><Icon className="h-4 w-4" /> {label}</button>
        ))}
      </div>

      {/* 💰 පැකේජ */}
      {sub === "plans" && <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><Sparkles className="h-6 w-6 text-primary" /> Plans & pricing</h2>
            <p className="text-sm text-muted-foreground">Edit prices, duration and features. Changes go live when you save.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/pricing" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary/40 hover:text-primary"><ExternalLink className="h-4 w-4" /> View Plans page</a>
            <button onClick={resetDefaults} disabled={saving} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-red-500/40 hover:text-red-500"><RotateCcw className="h-4 w-4" /> Reset to defaults</button>
          </div>
        </div>
        {!pricing ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" /> : (
          <>
            <div className="mt-6 grid gap-5 lg:grid-cols-3">
              {pricing.plans.map((plan, i) => {
                const th = THEME[plan.id];
                const Icon = th.icon;
                const isFree = plan.id === "free";
                return (
                  <div key={plan.id} className={`flex flex-col overflow-hidden rounded-3xl border bg-background transition ${plan.enabled ? "border-border" : "border-dashed border-border opacity-60"} ${plan.popular ? "ring-2 ring-primary/30" : ""}`}>
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
                      <p className="flex items-center gap-2 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span> {P[`${plan.id}Name` as const]}</p>
                      {/* Show / hide switch */}
                      <button type="button" role="switch" aria-checked={plan.enabled !== false} onClick={() => setPlan(i, { enabled: plan.enabled === false })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${plan.enabled !== false ? "bg-primary" : "bg-muted-foreground/30"}`} title="Show on Plans page">
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${plan.enabled !== false ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      {isFree ? (
                        <p className="text-3xl font-extrabold">LKR 0 <span className="text-sm font-medium text-muted-foreground">forever</span></p>
                      ) : (
                        <>
                          <div className="flex items-center overflow-hidden rounded-2xl border border-border focus-within:border-primary">
                            <span className="bg-muted px-3 py-3 text-sm font-bold text-muted-foreground">LKR</span>
                            <input type="number" min={0} value={plan.priceLkr} onChange={(e) => setPlan(i, { priceLkr: Number(e.target.value) })} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-2xl font-extrabold outline-none" />
                          </div>
                          {/* 🗓️ update-65: මිල = මාසයක මිල. මාස 2 / 3 / 6 / 12 මිල + අඩු කිරීම් යට "Durations" කොටසෙන් */}
                          <p className="text-xs text-muted-foreground">Price for <b className="text-foreground">1 month</b> — longer periods &amp; discounts are set in <b className="text-foreground">Durations</b> below.</p>
                          <button type="button" onClick={() => setPricing((p) => p && { ...p, plans: p.plans.map((x, k) => ({ ...x, popular: k === i ? !x.popular : false })) })} className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${plan.popular ? "bg-primary text-white" : "border border-border text-muted-foreground hover:border-primary/40"}`}><Star className={`h-3.5 w-3.5 ${plan.popular ? "fill-current" : ""}`} /> Most popular</button>
                        </>
                      )}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Features ({plan.features.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {FEATURE_KEYS.map((f) => {
                            const on = plan.features.includes(f);
                            return (
                              <button key={f} type="button" onClick={() => setPlan(i, { features: on ? plan.features.filter((x) => x !== f) : [...plan.features, f] })} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold leading-snug transition ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                {on ? <Check className="h-3 w-3 shrink-0" /> : <span className="h-3 w-3 shrink-0" />} {P[f as keyof typeof P]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🗓️ update-65: Durations — මාස 1 / 2 / 3 / 6 / 12 + එක එකට අඩු කිරීම (%) */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-border">
              <div className="border-b border-border bg-muted/40 px-5 py-4">
                <p className="text-lg font-extrabold">🗓️ Durations &amp; discounts</p>
                <p className="text-xs text-muted-foreground">Members choose how many months to buy on the Plans page. Turn a period on/off and set its discount.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="px-5 py-3">Period</th><th className="px-3 py-3">Show</th><th className="px-3 py-3">Discount</th>{pricing.plans.filter((p) => p.id !== "free").map((p) => <th key={p.id} className="px-3 py-3">{P[`${p.id}Name` as const]} total</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pricing.durations.map((d, k) => (
                      <tr key={d.months} className={d.enabled ? "" : "opacity-50"}>
                        <td className="px-5 py-3 font-bold">{d.months === 1 ? "1 month" : `${d.months} months`}</td>
                        <td className="px-3 py-3">
                          <button type="button" role="switch" aria-checked={d.enabled} disabled={d.months === 1} onClick={() => setPricing({ ...pricing, durations: pricing.durations.map((x, j) => (j === k ? { ...x, enabled: !x.enabled } : x)) })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed ${d.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${d.enabled ? "translate-x-6" : "translate-x-1"}`} />
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="inline-flex items-center overflow-hidden rounded-xl border border-border focus-within:border-primary">
                            <input type="number" min={0} max={90} value={d.discountPct} disabled={d.months === 1} onChange={(e) => setPricing({ ...pricing, durations: pricing.durations.map((x, j) => (j === k ? { ...x, discountPct: Number(e.target.value) } : x)) })} className="w-16 bg-transparent px-3 py-1.5 text-sm font-bold outline-none disabled:text-muted-foreground" aria-label={`Discount for ${d.months} months`} />
                            <span className="bg-muted px-2 py-1.5 text-xs font-bold text-muted-foreground">%</span>
                          </div>
                        </td>
                        {pricing.plans.filter((p) => p.id !== "free").map((p) => {
                          const pr = periodPrice(p.priceLkr, d);
                          return <td key={p.id} className="px-3 py-3"><b>LKR {pr.total.toLocaleString()}</b>{d.discountPct > 0 && <span className="ml-1.5 text-xs text-muted-foreground line-through">{pr.full.toLocaleString()}</span>}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ⚡ Boost settings */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
                <p className="flex items-center gap-2 text-lg font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Zap className="h-4 w-4" /></span> Profile boost</p>
                <button type="button" role="switch" aria-checked={pricing.boost.enabled} onClick={() => setPricing({ ...pricing, boost: { ...pricing.boost, enabled: !pricing.boost.enabled } })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${pricing.boost.enabled ? "bg-primary" : "bg-muted-foreground/30"}`} title="Enable boost">
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${pricing.boost.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.4fr_1fr] md:items-end">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Price</p>
                  <div className="flex items-center overflow-hidden rounded-2xl border border-border bg-background focus-within:border-primary">
                    <span className="bg-muted px-3 py-3 text-sm font-bold text-muted-foreground">LKR</span>
                    <input type="number" min={0} value={pricing.boost.priceLkr} onChange={(e) => setPricing({ ...pricing, boost: { ...pricing.boost, priceLkr: Number(e.target.value) } })} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-2xl font-extrabold outline-none" />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Days</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex gap-1 rounded-xl border border-border bg-background p-1">
                      {[3, 7, 14, 30].map((d) => <button key={d} type="button" onClick={() => setPricing({ ...pricing, boost: { ...pricing.boost, days: d } })} className={seg(pricing.boost.days === d)}>{d}d</button>)}
                    </div>
                    <input type="number" min={1} max={90} value={pricing.boost.days} onChange={(e) => setPricing({ ...pricing, boost: { ...pricing.boost, days: Number(e.target.value) } })} className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold outline-none focus:border-primary" aria-label="Custom days" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Shows as <b className="text-foreground">LKR {pricing.boost.priceLkr.toLocaleString()} / {pricing.boost.days} days</b><br />≈ LKR {Math.round(pricing.boost.priceLkr / Math.max(1, pricing.boost.days)).toLocaleString()} per day</p>
              </div>
            </div>
          </>
        )}
      </section>}

      {/* 💾 Save නොකළ වෙනස්කම් තියෙනවා නම් — යට sticky bar එකක් */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-4 z-[80] mx-auto flex w-[min(42rem,calc(100%-2rem))] items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 pl-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <p className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-amber-500" /> You have unsaved changes</p>
          <div className="flex gap-2">
            <button onClick={() => setPricing(normalizePricing(JSON.parse(saved)))} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Discard</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes</button>
          </div>
        </div>
      )}

      {/* 💎 Premium සාමාජිකයින් — දැන් ඉන්න අය + Premium දෙන්න */}
      {sub === "premium" && <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Crown className="h-6 w-6 text-primary" /> Premium members {premium && <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">{premium.length}</span>}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input value={grant.email} onChange={(e) => setGrant({ ...grant, email: e.target.value })} placeholder="user@email.com" className="w-56 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <select value={grant.months} onChange={(e) => setGrant({ ...grant, months: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>)}
            </select>
            <button disabled={!grant.email || busy === "grant"} onClick={async () => {
              setBusy("grant");
              const res = await fetch("/api/admin/premium", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "grant", email: grant.email, months: Number(grant.months) }) });
              setBusy(null);
              const d = await res.json().catch(() => null);
              if (!res.ok) return showAlert({ title: "Couldn't give Premium", message: d?.error, tone: "error" });
              setGrant({ email: "", months: "1" });
              showAlert({ title: `Premium until ${new Date(d.until).toLocaleDateString()}`, tone: "success" });
              loadPremium();
            }} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">{busy === "grant" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />} Give Premium</button>
          </div>
        </div>
        {premium === null ? <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-muted-foreground" /> : premium.length === 0 ? (
          <p className="mt-6 text-center text-muted-foreground">No Premium members right now</p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Member</th><th className="px-4 py-2.5">Source</th><th className="w-[38%] px-4 py-2.5">Time left</th><th className="px-4 py-2.5 text-right"></th></tr></thead>
              <tbody className="divide-y divide-border">
                {premium.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-semibold">{m.full_name || "—"} {m.founding_member && <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">👑 #{m.founding_number}</span>}</p><p className="text-xs text-muted-foreground">{m.email}</p></td>
                    <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3"><BoostProgress until={m.premium_until} startedAt={m.started_at} /></td>
                    <td className="px-4 py-3 text-right">
                      <button disabled={!!busy} onClick={async () => {
                        if (!(await showConfirm({ title: `Remove ${m.full_name}'s Premium now?`, tone: "danger", confirmText: "Remove" }))) return;
                        await fetch("/api/admin/premium", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", userId: m.id }) });
                        loadPremium();
                      }} title="Remove Premium" className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-red-500 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>}

      {/* ⚡ දැන් සක්‍රිය boosts — ඉවර වෙන්න කොච්චර තියෙනවද */}
      {sub === "boosts" && <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Zap className="h-6 w-6 text-primary" /> Live boosts {live && <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">{live.length}</span>}</h2>
          <p className="flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> &gt; 2 days</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> &lt; 2 days</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> &lt; 24h</span></p>
        </div>
        {live === null ? <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-muted-foreground" /> : live.length === 0 ? (
          <p className="mt-6 text-center text-muted-foreground">No active boosts right now</p>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2.5">Member</th><th className="w-[45%] px-4 py-2.5">Time left</th><th className="px-4 py-2.5 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {live.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><p className="font-semibold">{b.full_name || "—"}</p><p className="text-xs text-muted-foreground">{b.email}</p></td>
                    <td className="px-4 py-3"><BoostProgress until={b.boosted_until} startedAt={b.started_at} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button disabled={!!busy} onClick={() => act({ action: "extend", userId: b.id, days: 7 }, b.id + "x")} title="Extend 7 days" className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:border-primary hover:text-primary">+7d</button>
                        <button disabled={!!busy} onClick={async () => { if (await showConfirm({ title: `Stop ${b.full_name}'s boost now?`, tone: "danger", confirmText: "Stop" })) act({ action: "stop", userId: b.id }, b.id + "s"); }} title="Stop boost" className="rounded-lg border border-border p-1.5 text-muted-foreground hover:border-red-500 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>}

      {/* ⚡ Boost ඉල්ලීම් */}
      {sub === "boosts" && <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Zap className="h-6 w-6 text-primary" /> Boost requests</h2>
          <div className="flex rounded-xl border border-border p-1">
            {(["pending", "active", "rejected"] as const).map((s) => (
              <button key={s} onClick={() => { setReqs(null); setTab(s); }} className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${tab === s ? "bg-primary text-white" : "text-muted-foreground"}`}>{s}</button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Online payments aren&apos;t connected yet — contact the user, take the payment, then press <b>Activate</b>.</p>
        {reqs === null ? <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-muted-foreground" /> : reqs.length === 0 ? <p className="mt-6 text-center text-muted-foreground">No {tab} requests</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Phone</th><th className="py-2 pr-3">Boost</th><th className="py-2 pr-3">Requested</th><th className="py-2 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-border">
                {reqs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3"><p className="font-semibold">{r.profile?.full_name ?? "—"}</p><p className="text-xs text-muted-foreground">{r.profile?.email}</p></td>
                    <td className="py-3 pr-3">{r.phone ? <a href={`tel:${r.phone}`} className="text-primary hover:underline">{r.phone}</a> : "—"}</td>
                    <td className="py-3 pr-3">LKR {r.price_lkr.toLocaleString()} · {r.days} days</td>
                    <td className="py-3 pr-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {r.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button disabled={!!busy} onClick={() => act({ id: r.id, action: "reject" }, r.id + "r")} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:text-red-500"><X className="h-3.5 w-3.5" /> Reject</button>
                          <button disabled={!!busy} onClick={() => act({ id: r.id, action: "activate" }, r.id + "a")} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">{busy === r.id + "a" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Activate</button>
                        </div>
                      ) : r.status === "active" && r.profile?.boosted_until ? <span className="text-xs text-muted-foreground">until {new Date(r.profile.boosted_until).toLocaleDateString()}</span> : <span className="text-xs capitalize text-muted-foreground">{r.status}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ✋ අතින් boost (තෑග්ගක් / promotion) */}
        <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-5">
          <p className="w-full text-sm font-semibold">Boost a user manually</p>
          <input value={manual.email} onChange={(e) => setManual({ ...manual, email: e.target.value })} placeholder="user@email.com" className="min-w-[14rem] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <input type="number" min={1} max={90} value={manual.days} onChange={(e) => setManual({ ...manual, days: e.target.value })} className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <button disabled={!manual.email || busy === "manual"} onClick={() => act({ action: "manual", email: manual.email, days: Number(manual.days) }, "manual")} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">{busy === "manual" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Boost</button>
        </div>
      </section>}
    </div>
  );
}
