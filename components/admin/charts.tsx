// components/admin/charts.tsx — 📊 Admin dashboard එකේ graphs (අලුත් library එකක් නැතුව, SVG වලින්)
// Line/area chart (hover tooltip එක්ක), donut, horizontal bars, columns, sparkline.
"use client";

import { useEffect, useRef, useState } from "react";

export const CHART_COLORS = {
  primary: "#D52047",
  coral: "#F05160",
  wine: "#8E0B26",
  blue: "#3B82F6",
  green: "#16A34A",
  amber: "#F59E0B",
  slate: "#94A3B8",
  violet: "#8B5CF6",
};

// 👇 Container එකේ පළල (resize වෙනකොටත්)
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/** 📈 දින අනුව line / area chart — series කීපයක් එකට */
export function LineChart({ labels, series, height = 240 }: { labels: string[]; series: { name: string; color: string; values: number[] }[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const x = (i: number) => pad.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.t + h - (v / max) * h;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 70)))); // labels එකට උඩින් එකක් වැටෙන්නේ නැති වෙන්න

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - pad.l;
    setHover(Math.min(n - 1, Math.max(0, Math.round((px / Math.max(1, w)) * (n - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
          <defs>
            {series.map((s, si) => (
              <linearGradient key={si} id={`area-${si}-${s.color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {/* Grid + y labels */}
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={pad.l} x2={pad.l + w} y1={y(tv)} y2={y(tv)} stroke="var(--border)" strokeDasharray={tv === 0 ? "" : "3 4"} />
              <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{tv}</text>
            </g>
          ))}
          {/* X labels */}
          {labels.map((l, i) => (i % every === 0 || i === n - 1) && (
            <text key={l} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{fmtDay(l)}</text>
          ))}
          {/* Areas + lines */}
          {series.map((s, si) => {
            const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
            return (
              <g key={s.name}>
                {si === 0 && <polygon points={`${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`} fill={`url(#area-${si}-${s.color.slice(1)})`} />}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
          {/* Hover */}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
              {series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill="var(--background)" stroke={s.color} strokeWidth={2.5} />)}
            </g>
          )}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[8rem] rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(0, x(hover) - 64), width - 140) }}
        >
          <p className="mb-1 font-bold">{fmtDay(labels[hover])}</p>
          {series.map((s) => (
            <p key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}</span>
              <span className="font-bold">{s.values[hover] ?? 0}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** 🍩 Donut chart + legend */
export function Donut({ data, size = 150, centerLabel }: { data: { label: string; value: number; color: string }[]; size?: number; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* 👇 12 o'clock එකෙන් පටන් ගන්න කවය -90° කරකවනවා (මැද අකුරු කරකවන්නේ නෑ) */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={18} />
          {total > 0 && data.map((d) => {
            const len = (d.value / total) * c;
            const el = <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={18} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />;
            acc += len;
            return el;
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--foreground)">{total}</text>
        {centerLabel && <text x="50%" y="63%" textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">{centerLabel}</text>}
      </svg>
      <ul className="min-w-[8rem] flex-1 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.label}</span>
            <span className="font-semibold">{d.value} <span className="text-xs font-normal text-muted-foreground">{total ? Math.round((d.value / total) * 100) : 0}%</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 📊 තිරස් bars (දිස්ත්‍රික්ක වගේ) */
export function BarList({ data, color = CHART_COLORS.primary, empty = "No data yet" }: { data: { label: string; value: number }[]; color?: string; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="truncate">{d.label}</span><span className="font-semibold">{d.value}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 📶 සිරස් columns (වයස් කාණ්ඩ වගේ) */
export function Columns({ data, color = CHART_COLORS.coral, height = 170 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-bold">{d.value}</span>
          <div className="w-full max-w-[3rem] rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(2, (d.value / max) * (height - 44))}px`, background: `linear-gradient(180deg, ${color}, ${color}B3)` }} />
          <span className="text-[11px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** ✨ KPI card එකේ පොඩි trend line එක */
export function Sparkline({ values, color = CHART_COLORS.primary, width = 110, height = 34 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - (v / max) * (height - 4)}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
