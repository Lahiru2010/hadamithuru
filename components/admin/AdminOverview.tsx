// components/admin/AdminOverview.tsx — 🛡️ Admin: Overview (KPI cards + graphs)
"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, BadgeCheck, Flag, Headset, Heart, HeartHandshake, Loader2, MessageCircle, RefreshCw, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react";
import { BarList, CHART_COLORS, Columns, Donut, LineChart, Sparkline } from "@/components/admin/charts";

type Stats = {
  days: number;
  labels: string[];
  totals: {
    users: number; published: number; verified: number; newUsers: number; newUsersPrev: number;
    active24h: number; active7d: number; interests: number; interestsInRange: number; interestsPrev: number;
    matches: number; messages: number; messagesInRange: number;
    pendingVerifications: number; openReports: number; unreadSupport: number;
  };
  series: { signups: number[]; interests: number[]; matches: number[]; messages: number[] };
  breakdowns: {
    gender: { label: string; value: number }[];
    ages: { label: string; value: number }[];
    districts: { label: string; value: number }[];
    verification: { label: string; value: number }[];
    interestStatus: { label: string; value: number }[];
  };
  generatedAt: string;
  warnings?: string[];
};

type Tab = "users" | "verify" | "support" | "reports";

// 👇 කලින් කාලයට සාපේක්ෂව වෙනස (%)
const change = (now: number, prev: number) => (prev === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - prev) / prev) * 100));

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-border bg-background p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, sub, trend, spark, color }: { icon: typeof Users; label: string; value: number | string; sub?: string; trend?: number; spark?: number[]; color: string }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-3xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}1A`, color }}><Icon className="h-5 w-5" /></span>
        {spark && <Sparkline values={spark} color={color} />}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-extrabold tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${trend >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview({ onOpenTab }: { onOpenTab: (t: Tab) => void }) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    // (setLoading එක promise එක ඇතුළේ — effect එක ඇතුළේ කෙලින්ම setState නොකරන්න)
    Promise.resolve()
      .then(() => { setLoading(true); return fetch(`/api/admin/stats?days=${days}`, { cache: "no-store" }); })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error ?? "Failed to load stats");
        setStats(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    load();
    window.addEventListener("admin-data-changed", load); // ⚡ Realtime
    return () => window.removeEventListener("admin-data-changed", load);
  }, [load]);

  const T = stats?.totals;
  const period = `last ${days} days`;

  return (
    <div className="space-y-6">
      {/* 👇 කාල පරාසය + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Overview</h2>
          <p className="text-sm text-muted-foreground">{stats ? `Updated ${new Date(stats.generatedAt).toLocaleTimeString()}` : "Loading…"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-1 shadow-sm">
            {([7, 30, 90] as const).map((d) => (
              <button key={d} onClick={() => setDays(d)} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${days === d ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>{d}d</button>
            ))}
          </div>
          <button onClick={load} aria-label="Refresh" className="rounded-xl border border-border bg-background p-2.5 text-muted-foreground shadow-sm hover:text-primary">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">Couldn&apos;t load statistics: {error}</p>}
      {/* 👇 කොටසක් විතරක් load නොවුණොත් (උදා: පරණ database එකේ column එකක් නැති නම්) */}
      {stats?.warnings?.length ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Some charts may be incomplete:</p>
          <ul className="mt-1 list-disc pl-5">{stats.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      ) : null}

      {!stats ? (
        <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* 👇 ඉක්මනින් බලන්න ඕන දේවල් (click කළාම ඒ tab එක) */}
          {(T!.pendingVerifications > 0 || T!.unreadSupport > 0 || T!.openReports > 0) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { n: T!.pendingVerifications, label: "verification requests waiting", icon: BadgeCheck, tab: "verify" as const, cls: "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300" },
                { n: T!.unreadSupport, label: "unread support messages", icon: Headset, tab: "support" as const, cls: "border-primary/30 bg-primary/5 text-primary" },
                { n: T!.openReports, label: "open reports", icon: Flag, tab: "reports" as const, cls: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300" },
              ].filter((x) => x.n > 0).map(({ n, label, icon: Icon, tab, cls }) => (
                <button key={tab} onClick={() => onOpenTab(tab)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${cls}`}>
                  <Icon className="h-5 w-5 shrink-0" /> <span><span className="text-lg font-extrabold">{n}</span> {label}</span>
                </button>
              ))}
            </div>
          )}

          {/* 👇 KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Users} label="Total members" value={T!.users} sub={`${T!.published.toLocaleString()} published`} color={CHART_COLORS.primary} />
            <Kpi icon={UserPlus} label={`New members (${days}d)`} value={T!.newUsers} trend={change(T!.newUsers, T!.newUsersPrev)} sub="vs previous period" spark={stats.series.signups} color={CHART_COLORS.coral} />
            <Kpi icon={Activity} label="Active in last 24h" value={T!.active24h} sub={`${T!.active7d.toLocaleString()} in 7 days`} color={CHART_COLORS.green} />
            <Kpi icon={BadgeCheck} label="Verified members" value={T!.verified} sub={`${T!.users ? Math.round((T!.verified / T!.users) * 100) : 0}% of all`} color={CHART_COLORS.blue} />
            <Kpi icon={Heart} label={`Interests sent (${days}d)`} value={T!.interestsInRange} trend={change(T!.interestsInRange, T!.interestsPrev)} sub="vs previous period" spark={stats.series.interests} color={CHART_COLORS.wine} />
            <Kpi icon={HeartHandshake} label="Total matches" value={T!.matches} sub={`${T!.interests ? Math.round((T!.matches / T!.interests) * 100) : 0}% of interests accepted`} color={CHART_COLORS.violet} />
            <Kpi icon={MessageCircle} label={`Messages (${days}d)`} value={T!.messagesInRange} sub={`${T!.messages.toLocaleString()} all time`} spark={stats.series.messages} color={CHART_COLORS.amber} />
            <Kpi icon={Flag} label="Open reports" value={T!.openReports} sub={`${T!.pendingVerifications} verifications pending`} color={CHART_COLORS.slate} />
          </div>

          {/* 👇 Graphs */}
          <div className="grid gap-4 xl:grid-cols-3">
            <Card title="New members" subtitle={`Sign-ups per day · ${period}`} className="xl:col-span-2">
              <LineChart labels={stats.labels} series={[{ name: "Sign-ups", color: CHART_COLORS.primary, values: stats.series.signups }]} />
            </Card>
            <Card title="Gender" subtitle="All members">
              <Donut centerLabel="members" data={stats.breakdowns.gender.map((g, i) => ({ ...g, color: [CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.slate][i] }))} />
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card title="Activity" subtitle={`Interests, matches & messages per day · ${period}`} className="xl:col-span-2">
              <div className="mb-3 flex flex-wrap gap-4 text-xs">
                {[["Interests", CHART_COLORS.wine], ["Matches", CHART_COLORS.green], ["Messages", CHART_COLORS.amber]].map(([n, c]) => (
                  <span key={n} className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-4 rounded-full" style={{ background: c }} /> {n}</span>
                ))}
              </div>
              <LineChart
                labels={stats.labels}
                series={[
                  { name: "Interests", color: CHART_COLORS.wine, values: stats.series.interests },
                  { name: "Matches", color: CHART_COLORS.green, values: stats.series.matches },
                  { name: "Messages", color: CHART_COLORS.amber, values: stats.series.messages },
                ]}
              />
            </Card>
            <Card title="Interest outcomes" subtitle="All time">
              <Donut centerLabel="interests" data={stats.breakdowns.interestStatus.map((g, i) => ({ ...g, color: [CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.slate][i] }))} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Age groups" subtitle="All members">
              <Columns data={stats.breakdowns.ages} />
            </Card>
            <Card title="Top districts" subtitle="Where members live">
              <BarList data={stats.breakdowns.districts} />
            </Card>
            <Card title="Verification" subtitle="ID verification status">
              <Donut centerLabel="members" data={stats.breakdowns.verification.map((g, i) => ({ ...g, color: [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.slate][i] }))} />
              <button onClick={() => onOpenTab("verify")} className="mt-4 w-full rounded-xl border border-border py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary">Open verification queue</button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
