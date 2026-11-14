// components/HoroscopeSummary.tsx — 🔮 My profile → සමාලෝචනය: කේන්දරය දාලා නම් කෙටි සාරාංශයක් (ලග්නය · නැකත · පොඩි සටහනක්)
"use client";

import { useEffect, useState } from "react";
import { Lock, Pencil, Star } from "lucide-react";
import { useLang } from "@/components/providers";
import HoroscopeChart from "@/components/HoroscopeChart";
import { NAKSHATRAS, SIGNS, type Horoscope } from "@/lib/porondam";

export default function HoroscopeSummary({ onEdit }: { onEdit?: () => void }) {
  const { t, lang } = useLang();
  const H = t.horo;
  const [h, setH] = useState<Horoscope | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/horoscope", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setH(d?.horoscope ?? null)).catch(() => setH(null));
  }, []);
  if (!h) return null; // කේන්දරයක් නැත්නම් / load වෙනකම් කිසිවක් නෑ
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary"><Star className="h-4 w-4" /> {H.title}</h3>
        {onEdit && <button type="button" onClick={onEdit} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /> {t.wizard.edit}</button>}
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="w-36 shrink-0"><HoroscopeChart lagna={h.lagna} planets={h.planets} lang={lang} title={H.lagna} /></div>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{H.lagna}</dt><dd className="font-semibold">{(SIGNS[lang] ?? SIGNS.si)[h.lagna]}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{H.nakshatra}</dt><dd className="font-semibold">{(NAKSHATRAS[lang] ?? NAKSHATRAS.si)[h.nakshatra]} · {H.pada} {h.pada}</dd></div>
          <div className="col-span-2"><dd className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><Lock className="h-4 w-4 shrink-0" /> {H.private.replace(/^🔒\s*/, "")}</dd></div>
        </dl>
      </div>
    </div>
  );
}
