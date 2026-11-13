// components/form/TownCombobox.tsx
// ශ්‍රී ලංකාවේ නගර search කරලා තෝරන්න. List එකේ නැත්නම් type කරපු එකම Enter ඔබලා යොදන්න පුළුවන්.
"use client";

import { useId, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useLang } from "@/components/providers";
import { useTr } from "@/components/OptionTranslations";
import { ALL_SRI_LANKAN_TOWNS } from "@/lib/profile-options";
import { usePopover } from "./usePopover";

export default function TownCombobox({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const { t } = useLang();
  const W = t.wizard;
  const tr = useTr();
  const { open, setOpen, ref } = usePopover();
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? ALL_SRI_LANKAN_TOWNS.filter(({ town }) => town.toLowerCase().includes(q) || String(tr(town)).toLowerCase().includes(q))
      : ALL_SRI_LANKAN_TOWNS;
    return list.slice(0, 50);
  }, [query, tr]);

  const typed = query.trim();
  const exact = results.some((r) => r.town.toLowerCase() === typed.toLowerCase());
  const options = [...results.map((r) => ({ value: r.town, hint: String(tr(r.district)) })), ...(typed && !exact ? [{ value: typed, hint: "", custom: true }] : [])];

  const choose = (v: string) => { onChange(v); setQuery(v); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <div className={`flex items-center gap-2 rounded-xl border bg-muted/30 px-3 transition focus-within:ring-2 focus-within:ring-primary/20 ${invalid ? "border-red-500" : "border-border focus-within:border-primary"}`}>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={W.searchTown}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value.trim()); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter") { e.preventDefault(); const o = options[active]; if (o) choose(o.value); else if (typed) choose(typed); }
          }}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
        />
      </div>

      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-2xl custom-scrollbar">
          {options.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground">{W.noTownMatch}</li>}
          {options.map((o, i) => (
            <li key={`${o.value}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.value)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${i === active ? "bg-primary/10 text-primary" : ""}`}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="flex-1 truncate">{"custom" in o ? W.useCustom.replace("{x}", o.value) : String(tr(o.value))}</span>
                {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
