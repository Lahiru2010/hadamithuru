// components/PhoneInput.tsx
// රටේ කොඩිය + code එක (default 🇱🇰 +94) තෝරන dropdown එකයි, number එක type කරන input එකයි.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTr } from "@/components/OptionTranslations";
import { DIAL_COUNTRIES, flagUrl, getDialCountry } from "@/lib/phone";

export default function PhoneInput({
  country,
  number,
  onChange,
  invalid = false,
  id,
}: {
  country: string;
  number: string;
  onChange: (country: string, number: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = getDialCountry(country);

  // පිටතින් click කළාම / Esc ඔබපුවාම dropdown එක වහනවා
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DIAL_COUNTRIES;
    return DIAL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || String(tr(c.name)).toLowerCase().includes(q) || `+${c.dial}`.includes(q.replace(/^\+?/, "+"))
    );
  }, [query, tr]);

  return (
    <div ref={boxRef} className="relative">
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border bg-muted/30 transition focus-within:ring-2 focus-within:ring-primary/20 ${
          invalid ? "border-red-500" : "border-border focus-within:border-primary"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={String(tr(current.name))}
          className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 text-sm font-semibold hover:bg-muted/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagUrl(current.iso)} alt="" width={22} height={16} className="h-4 w-[22px] rounded-sm object-cover shadow-sm" />
          <span>+{current.dial}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={current.example}
          value={number}
          onChange={(e) => onChange(current.iso, e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg bg-muted/40 py-2 pl-8 pr-3 text-sm outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
            {list.map((c) => {
              const selected = c.iso === current.iso;
              return (
                <li key={c.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(c.iso, number); setOpen(false); setQuery(""); }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60 ${selected ? "bg-primary/10 font-semibold text-primary" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagUrl(c.iso)} alt="" width={22} height={16} loading="lazy" className="h-4 w-[22px] shrink-0 rounded-sm object-cover shadow-sm" />
                    <span className="flex-1 truncate">{String(tr(c.name))}</span>
                    <span className="text-muted-foreground">+{c.dial}</span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
