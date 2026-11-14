// components/HoroscopeEditor.tsx — 🔮 මගේ කේන්දරය: උපන් විස්තර අනුව ගණනය → අතින් හදන්න → සුරකින්න
// • /horoscope page එකේ (සම්පූර්ණ) · My profile එකේ ආගම පියවරේ (embedded — උපන් විස්තර wizard එකෙන්)
"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Lock, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import HoroscopeChart from "@/components/HoroscopeChart";
import { DISTRICT_COORDS, computeHoroscope } from "@/lib/horoscope";
import { NAKSHATRAS, PLANETS, PLANET_NAMES, SIGNS, type Horoscope, type PlanetKey } from "@/lib/porondam";
import { DISTRICT_OPTIONS, TOWNS_BY_DISTRICT } from "@/lib/profile-options";
import DatePicker from "@/components/form/DatePicker";
import TimePicker from "@/components/form/TimePicker";
import Dropdown from "@/components/ui/Dropdown";
import { useTr } from "@/components/OptionTranslations";

// 👇 උපන් නගරය (profile එකේ) → දිස්ත්‍රික්කය
const districtOfTown = (place: string) => {
  const p = place.trim().toLowerCase();
  if (!p) return "Colombo";
  for (const [d, towns] of Object.entries(TOWNS_BY_DISTRICT)) {
    if (d.toLowerCase() === p || towns.some((t) => t.toLowerCase() === p)) return d;
  }
  return "Colombo";
};

export default function HoroscopeEditor({ embedded }: { embedded?: { date: string; time: string; place: string } }) {
  const { t, lang } = useLang();
  const H = t.horo;
  const { showAlert } = useDialog();
  const tr = useTr();
  const [birth, setBirth] = useState({ date: "", time: "", district: "Colombo", place: "" });
  const [horo, setHoro] = useState<Horoscope | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const signs = SIGNS[lang] ?? SIGNS.si;
  const names = PLANET_NAMES[lang] ?? PLANET_NAMES.si;
  const naks = NAKSHATRAS[lang] ?? NAKSHATRAS.si;

  useEffect(() => {
    fetch("/api/horoscope", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d) {
        setBirth({ date: d.birth?.date ?? "", time: d.birth?.time ?? "", place: d.birth?.place ?? "", district: districtOfTown(d.birth?.place ?? "") });
        if (d.horoscope) setHoro(d.horoscope);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const generate = () => {
    const b = embedded ? { date: embedded.date, time: embedded.time, place: embedded.place, district: districtOfTown(embedded.place) } : birth;
    if (!b.date || !b.time) return showAlert({ title: H.needBirth, tone: "error" });
    const [lat, lon] = DISTRICT_COORDS[b.district] ?? DISTRICT_COORDS.Colombo;
    setHoro(computeHoroscope({ date: b.date, time: b.time, lat, lon, place: b.place || b.district }));
    setEditing(false);
  };

  const edit = (patch: Partial<Horoscope> | { planet: PlanetKey; sign: number }) =>
    setHoro((h) => {
      if (!h) return h;
      if ("planet" in patch) return { ...h, source: "edited", planets: { ...h.planets, [patch.planet]: patch.sign } };
      return { ...h, ...patch, source: "edited" };
    });

  const save = async () => {
    if (!horo) return;
    setSaving(true);
    const res = await fetch("/api/horoscope", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ horoscope: horo }) });
    setSaving(false);
    if (!res.ok) return showAlert({ title: H.error, tone: "error" });
    setEditing(false);
    showAlert({ title: H.saved, tone: "success" });
  };

  const signOpts = signs.map((sg, i) => ({ value: String(i), label: sg }));

  if (loading) return <div className="flex min-h-[12rem] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
        {!embedded && <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D52047] to-[#AD032A] text-white shadow-lg shadow-primary/25"><Sparkles className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{H.title}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">{H.subtitle}</p>
          </div>
        </div>}

        {/* 👇 උපන් විස්තර (embedded නම් wizard එකේ තියෙන ඒවා — මෙතන button එක විතරයි) */}
        {embedded ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{H.embeddedHint}</p>
            <button type="button" onClick={generate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90">{horo ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} {horo ? H.regenerate : H.generate}</button>
          </div>
        ) : <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end">
            {/* 👇 Site එකේ සම්මත pickers (My profile එකේ වගේම) */}
            <div className="text-sm font-semibold">{H.date}<div className="mt-1.5"><DatePicker value={birth.date} onChange={(v) => setBirth({ ...birth, date: v })} /></div></div>
            <div className="text-sm font-semibold">{H.time}<div className="mt-1.5"><TimePicker value={birth.time} onChange={(v) => setBirth({ ...birth, time: v })} /></div></div>
            <div className="text-sm font-semibold">{H.place}<div className="mt-1.5"><Dropdown value={birth.district} onChange={(v) => setBirth({ ...birth, district: v })} ariaLabel={H.place} fullWidth options={DISTRICT_OPTIONS.map((d) => ({ value: d, label: String(tr(d)) }))} /></div></div>
            <button type="button" onClick={generate} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90">
              {horo ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />} {horo ? H.regenerate : H.generate}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{H.outside}</p>
        </section>}

        {horo && (
          <>
            {/* 👇 කේන්දර සටහන් දෙක */}
            <section className="mt-6 rounded-3xl border border-border bg-background p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{H.nakshatra}: {naks[horo.nakshatra]} · {H.pada} {horo.pada}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${horo.source === "edited" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>{horo.source === "edited" ? H.edited : H.generated}</span>
                </p>
                <button type="button" onClick={() => setEditing((e) => !e)} className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${editing ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:text-primary"}`}><Pencil className="h-4 w-4" /> {H.edit}</button>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <figure className="flex flex-col items-center">
                  <HoroscopeChart lagna={horo.lagna} planets={horo.planets} lang={lang} title={H.lagna} />
                  <figcaption className="mt-2 text-sm font-semibold text-muted-foreground">{H.rashi}</figcaption>
                </figure>
                {horo.navamsa && horo.navamsaLagna !== undefined && horo.source !== "edited" && (
                  <figure className="flex flex-col items-center">
                    <HoroscopeChart lagna={horo.navamsaLagna} planets={horo.navamsa} lang={lang} title={H.navamsa} />
                    <figcaption className="mt-2 text-sm font-semibold text-muted-foreground">{H.navamsa}</figcaption>
                  </figure>
                )}
              </div>

              {/* ✏️ අතින් හදන්න */}
              {editing && (
                <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
                  <p className="mb-4 text-sm text-muted-foreground">{H.editHint}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <label className="text-xs font-bold text-primary">{H.lagna}
                      <div className="mt-1"><Dropdown value={String(horo.lagna)} onChange={(v) => edit({ lagna: Number(v) })} ariaLabel={H.lagna} fullWidth options={signOpts} /></div>
                    </label>
                    {PLANETS.map((p) => (
                      <label key={p} className="text-xs font-semibold text-muted-foreground">{names[p]}
                        <div className="mt-1"><Dropdown value={String(horo.planets[p])} onChange={(v) => edit({ planet: p, sign: Number(v) })} ariaLabel={names[p]} fullWidth options={signOpts} /></div>
                      </label>
                    ))}
                    <label className="text-xs font-semibold text-muted-foreground">{H.nakshatra}
                      <div className="mt-1"><Dropdown value={String(horo.nakshatra)} onChange={(v) => edit({ nakshatra: Number(v) })} ariaLabel={H.nakshatra} fullWidth options={naks.map((n, i) => ({ value: String(i), label: n }))} /></div>
                    </label>
                    <label className="text-xs font-semibold text-muted-foreground">{H.pada}
                      <div className="mt-1"><Dropdown value={String(horo.pada)} onChange={(v) => edit({ pada: Number(v) })} ariaLabel={H.pada} fullWidth options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))} /></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                {/* 🔒 update-64: පෞද්ගලිකත්ව සටහන — පැහැදිලිව පේන කොටුවක */}
                <p className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-snug text-emerald-800 dark:text-emerald-300">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"><Lock className="h-4 w-4" /></span>
                  {H.private.replace(/^🔒\s*/, "")}
                </p>
                <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {H.save}
                </button>
              </div>
            </section>
          </>
        )}
    </div>
  );
}
