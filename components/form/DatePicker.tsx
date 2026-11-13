// components/form/DatePicker.tsx
// Site එකේ design එකට ගැලපෙන calendar එක. Value එක "YYYY-MM-DD".
// මාසය සහ අවුරුද්ද dropdown වලින් ඉක්මනින් තෝරන්න පුළුවන් (උපන් දින වලට වැදගත්).
"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useLang } from "@/components/providers";
import { fieldButtonClass, localeFor, usePopover } from "./usePopover";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function DatePicker({
  value,
  onChange,
  invalid,
  placeholder,
  minYear = 1940,
  maxDate,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  minYear?: number;
  /** "YYYY-MM-DD" — මීට පස්සේ දින තෝරන්න බෑ (default: අද) */
  maxDate?: string;
}) {
  const { lang, t } = useLang();
  const W = t.wizard;
  const locale = localeFor(lang);
  const { open, setOpen, ref } = usePopover();

  const max = useMemo(() => (maxDate ? new Date(maxDate + "T00:00:00") : new Date()), [maxDate]);
  const selected = value ? new Date(value + "T00:00:00") : null;

  // Calendar එකේ පේන මාසය (තෝරපු දිනය, නැත්නම් අවුරුදු 25කට කලින්)
  const [view, setView] = useState(() => {
    const base = selected ?? new Date(max.getFullYear() - 25, 0, 1);
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, i, 1))),
    [locale]
  );
  // සඳුදා සිට ඉරිදා දක්වා
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i))),
    [locale]
  );
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = max.getFullYear(); y >= minYear; y--) list.push(y);
    return list;
  }, [max, minYear]);

  const firstDay = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    if (d.getFullYear() < minYear || d > max) return;
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const label = selected
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(selected)
    : placeholder ?? W.pickDate;

  const selectClass = "appearance-none rounded-lg bg-muted/50 py-1.5 pl-2.5 pr-7 text-sm font-semibold outline-none hover:bg-muted cursor-pointer";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} className={fieldButtonClass(invalid)}>
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>{label}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div role="dialog" className="absolute left-0 z-40 mt-2 w-[19rem] rounded-2xl border border-border bg-background p-4 shadow-2xl">
          {/* මාසය / අවුරුද්ද */}
          <div className="mb-3 flex items-center gap-1">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-1 justify-center gap-1.5">
              <div className="relative">
                <select value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))} aria-label="Month" className={selectClass}>
                  {monthNames.map((n, i) => <option key={n} value={i}>{n}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="relative">
                <select value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))} aria-label="Year" className={selectClass}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <button type="button" onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* දවස් */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((d, i) => <span key={i} className="py-1 text-[11px] font-semibold text-muted-foreground">{d}</span>)}
            {cells.map((day, i) => {
              if (!day) return <span key={`e${i}`} />;
              const date = new Date(view.y, view.m, day);
              const iso = toISO(view.y, view.m, day);
              const disabled = date > max;
              const isSelected = value === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-9 rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-primary font-bold text-white shadow-md shadow-primary/30"
                      : disabled
                        ? "cursor-not-allowed text-muted-foreground/30"
                        : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <div className="mt-3 flex justify-end border-t border-border pt-3">
              <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                {W.clear}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
