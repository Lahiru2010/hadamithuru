// components/form/TimePicker.tsx
// පැය / මිනිත්තු / AM-PM columns වලින් වේලාව තෝරන picker එක. Value එක "HH:MM" (24h).
"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { useLang } from "@/components/providers";
import { fieldButtonClass, usePopover } from "./usePopover";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function split(value: string) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return { h12: h % 12 === 0 ? 12 : h % 12, m, pm: h >= 12 };
}
const join = (h12: number, m: number, pm: boolean) => `${pad((h12 % 12) + (pm ? 12 : 0))}:${pad(m)}`;

export default function TimePicker({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const { t } = useLang();
  const W = t.wizard;
  const { open, setOpen, ref } = usePopover();
  const parts = split(value);
  const cur = parts ?? { h12: 6, m: 0, pm: false };
  const hourList = useRef<HTMLDivElement>(null);
  const minuteList = useRef<HTMLDivElement>(null);

  // Open වුණාම තෝරපු පැය / මිනිත්තුවට scroll කරනවා
  useEffect(() => {
    if (!open) return;
    hourList.current?.querySelector("[data-active='true']")?.scrollIntoView({ block: "center" });
    minuteList.current?.querySelector("[data-active='true']")?.scrollIntoView({ block: "center" });
  }, [open]);

  const label = parts ? `${pad(parts.h12)}:${pad(parts.m)} ${parts.pm ? "PM" : "AM"}` : W.pickTime;
  const cell = (active: boolean) =>
    `w-full rounded-lg py-1.5 text-sm transition ${active ? "bg-primary font-bold text-white" : "hover:bg-primary/10 hover:text-primary"}`;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} className={fieldButtonClass(invalid)}>
        <span className={parts ? "text-foreground" : "text-muted-foreground"}>{label}</span>
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div role="dialog" className="absolute left-0 z-40 mt-2 w-64 rounded-2xl border border-border bg-background p-3 shadow-2xl">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <div>
              <p className="mb-1 text-center text-[11px] font-semibold text-muted-foreground">{W.hour}</p>
              <div ref={hourList} className="h-48 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {HOURS.map((h) => (
                  <button key={h} type="button" data-active={parts?.h12 === h} onClick={() => onChange(join(h, cur.m, cur.pm))} className={cell(parts?.h12 === h)}>
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-center text-[11px] font-semibold text-muted-foreground">{W.minute}</p>
              <div ref={minuteList} className="h-48 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                {MINUTES.map((m) => (
                  <button key={m} type="button" data-active={parts?.m === m} onClick={() => onChange(join(cur.h12, m, cur.pm))} className={cell(parts?.m === m)}>
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1 pt-5">
              {[false, true].map((pm) => (
                <button key={String(pm)} type="button" onClick={() => onChange(join(cur.h12, cur.m, pm))} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${parts && parts.pm === pm ? "bg-primary text-white" : "bg-muted/50 hover:bg-primary/10 hover:text-primary"}`}>
                  {pm ? "PM" : "AM"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">{W.clear}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white">{W.done}</button>
          </div>
        </div>
      )}
    </div>
  );
}
