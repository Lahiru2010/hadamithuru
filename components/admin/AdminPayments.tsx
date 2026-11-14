// components/admin/AdminPayments.tsx — 🛡️ Admin: 💳 PayHere ගෙවීම් (update-67)
"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, Crown, Gem, Loader2, Zap } from "lucide-react";

type Pay = {
  id: string; order_id: string; item: "gold" | "platinum" | "boost"; months: number | null; days: number | null; amount: number; currency: string;
  status: "paid" | "pending" | "failed" | "cancelled" | "chargeback"; payhere_payment_id: string | null; method: string | null; status_message: string | null;
  granted_until: string | null; created_at: string; paid_at: string | null; profile: { full_name: string | null; email: string | null } | null;
};
type Resp = { configured: boolean; sandbox: boolean; totals: { month: number; total: number; count: number }; payments: Pay[]; error?: string };

const FILTERS = [
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "chargeback", label: "Chargeback" },
  { id: "all", label: "All" },
] as const;

const STATUS_CLS: Record<Pay["status"], string> = {
  paid: "bg-green-500/15 text-green-700 dark:text-green-400",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  chargeback: "bg-red-600 text-white",
};
const lkr = (n: number) => `LKR ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const ITEM = { gold: { label: "Gold", Icon: Crown, cls: "text-amber-500" }, platinum: { label: "Platinum", Icon: Gem, cls: "text-violet-500" }, boost: { label: "Boost", Icon: Zap, cls: "text-amber-500" } };

export default function AdminPayments() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("paid");
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    const load = () => fetch(`/api/admin/payments?status=${filter}`, { cache: "no-store" }).then((r) => r.json()).then((d) => active && setData(d)).catch(() => active && setData({ configured: false, sandbox: false, totals: { month: 0, total: 0, count: 0 }, payments: [] }));
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><CreditCard className="h-5 w-5 text-primary" /> Payments (PayHere)</h2>
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${filter === f.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {data && !data.configured && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          PayHere සකස් කරලා නෑ — Vercel එකේ <code>PAYHERE_MERCHANT_ID</code> සහ <code>PAYHERE_MERCHANT_SECRET</code> දාලා Redeploy කරන්න. ඒ වෙනකම් members ලට පේන්නේ &quot;ළඟදීම&quot; කියලා.
        </p>
      )}
      {data?.sandbox && <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-300">🧪 Sandbox (test) mode — ඇත්ත මුදල් නෙවෙයි</p>}
      {data?.error && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">Table එක නෑ වගේ — <code>20261205_payhere_payments.sql</code> එක Supabase SQL Editor එකේ run කරන්න. ({data.error})</p>}

      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">This month</p><p className="mt-1 text-2xl font-extrabold">{lkr(data.totals.month)}</p></div>
          <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">All time</p><p className="mt-1 text-2xl font-extrabold">{lkr(data.totals.total)}</p></div>
          <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Paid orders</p><p className="mt-1 text-2xl font-extrabold">{data.totals.count}</p></div>
        </div>
      )}

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : data.payments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">No payments here.</p>
      ) : (
        <ul className="space-y-2">
          {data.payments.map((p) => {
            const it = ITEM[p.item];
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      <it.Icon className={`h-4 w-4 ${it.cls}`} /> {it.label}
                      <span className="text-sm font-semibold text-muted-foreground">{p.item === "boost" ? `${p.days} days` : `${p.months} month${(p.months ?? 1) > 1 ? "s" : ""}`}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${STATUS_CLS[p.status]}`}>{p.status}</span>
                    </p>
                    <p className="mt-1 text-sm">
                      {p.profile?.full_name ?? "—"} {p.profile?.email && <a href={`mailto:${p.profile.email}`} className="ml-1 font-semibold text-primary hover:underline">{p.profile.email}</a>}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{p.order_id}</span>
                      {p.payhere_payment_id && <span>PayHere #{p.payhere_payment_id}</span>}
                      {p.method && <span>{p.method}</span>}
                      <span>{new Date(p.paid_at ?? p.created_at).toLocaleString()}</span>
                      {p.granted_until && <span>Until {new Date(p.granted_until).toLocaleDateString()}</span>}
                      {p.status_message && <span className="text-red-500">{p.status_message}</span>}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold">{lkr(p.amount)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
