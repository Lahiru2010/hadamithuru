// app/preferences/page.tsx — 💞 මම කැමති සහකරු (Partner preferences)
// profiles.partner_prefs (jsonb) එකට save කරනවා → lib/match.ts එකේ "preferences" ලකුණු (30) + Browse එකේ "අද ඔබට 5 දෙනා"
"use client";

import { useEffect, useState } from "react";
import { Check, HeartHandshake, Loader2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useTr } from "@/components/OptionTranslations";
import { useDialog } from "@/components/DialogProvider";
import type { PartnerPrefs } from "@/lib/match";
import {
  DISTRICT_OPTIONS, EDUCATION_OPTIONS, FOOD_OPTIONS, HEIGHT_OPTIONS, MARITAL_STATUS_OPTIONS,
  MOTHER_TONGUE_OPTIONS, RELIGION_OPTIONS, YES_NO_SOMETIMES_OPTIONS,
} from "@/lib/profile-options";

const AGES = Array.from({ length: 53 }, (_, i) => 18 + i); // 18–70

export default function PreferencesPage() {
  const { t } = useLang();
  const P = t.prefs;
  const tr = useTr();
  const { showAlert } = useDialog();
  const [prefs, setPrefs] = useState<PartnerPrefs>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (uid) {
        const { data: p } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
        if (p?.partner_prefs) setPrefs(p.partner_prefs as PartnerPrefs);
      }
      setLoading(false);
    });
  }, []);

  const set = <K extends keyof PartnerPrefs>(k: K, v: PartnerPrefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));
  const toggle = (k: "religions" | "motherTongues" | "civilStatus" | "districts", v: string) =>
    setPrefs((p) => {
      const list = p[k] ?? [];
      return { ...p, [k]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] };
    });

  const save = async () => {
    setSaving(true);
    const sb = createClient();
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    // 👇 හිස් අගයන් අයින් කරලා save කරනවා
    const clean = Object.fromEntries(Object.entries(prefs).filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0)));
    const { error } = uid ? await sb.from("profiles").update({ partner_prefs: clean }).eq("id", uid) : { error: { message: "Not signed in" } };
    setSaving(false);
    if (error) return showAlert({ title: P.error, message: error.message, tone: "error" });
    window.dispatchEvent(new Event("profile-updated")); // 👈 ගැලපීම් % ඒ ගමන්ම අලුත් වෙන්න (useMyProfile)
    showAlert({ title: P.saved, tone: "success" });
  };

  const chips = (k: "religions" | "motherTongues" | "civilStatus" | "districts", options: string[]) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = (prefs[k] ?? []).includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(k, o)} aria-pressed={on} className={`flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${on ? "border-primary bg-primary text-white" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary"}`}>
            {on && <Check className="h-3.5 w-3.5" />} {String(tr(o))}
          </button>
        );
      })}
    </div>
  );
  const select = (value: string | number | undefined, onChange: (v: string) => void, options: (string | number)[], label?: string) => (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-label={label} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary">
      <option value="">{P.any}</option>
      {options.map((o) => <option key={o} value={o}>{typeof o === "number" ? o : String(tr(o))}</option>)}
    </select>
  );
  const card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <h2 className="mb-4 font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></main>;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/25"><HeartHandshake className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{P.title}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">{P.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {card({ title: P.age, children: (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">{P.from}{select(prefs.ageMin, (v) => set("ageMin", v ? Number(v) : undefined), AGES, P.from)}</label>
              <label className="text-xs font-semibold text-muted-foreground">{P.to}{select(prefs.ageMax, (v) => set("ageMax", v ? Number(v) : undefined), AGES, P.to)}</label>
            </div>
          ) })}
          {card({ title: P.height, children: (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">{P.from}{select(prefs.heightMin, (v) => set("heightMin", v || undefined), HEIGHT_OPTIONS, P.from)}</label>
              <label className="text-xs font-semibold text-muted-foreground">{P.to}{select(prefs.heightMax, (v) => set("heightMax", v || undefined), HEIGHT_OPTIONS, P.to)}</label>
            </div>
          ) })}
          {card({ title: P.religion, children: chips("religions", RELIGION_OPTIONS) })}
          {card({ title: P.motherTongue, children: chips("motherTongues", MOTHER_TONGUE_OPTIONS) })}
          {card({ title: P.civilStatus, children: chips("civilStatus", MARITAL_STATUS_OPTIONS) })}
          {card({ title: P.educationMin, children: select(prefs.educationMin, (v) => set("educationMin", v || undefined), EDUCATION_OPTIONS.filter((e) => e !== "Other"), P.educationMin) })}
          {card({ title: P.lifestyle, children: (
            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">{P.food}{select(prefs.food, (v) => set("food", v || undefined), FOOD_OPTIONS, P.food)}</label>
              <label className="text-xs font-semibold text-muted-foreground">{P.smoking}{select(prefs.smoking, (v) => set("smoking", v || undefined), YES_NO_SOMETIMES_OPTIONS, P.smoking)}</label>
              <label className="text-xs font-semibold text-muted-foreground">{P.drinking}{select(prefs.drinking, (v) => set("drinking", v || undefined), YES_NO_SOMETIMES_OPTIONS, P.drinking)}</label>
            </div>
          ) })}
          <div className="md:col-span-2">{card({ title: P.districts, children: chips("districts", DISTRICT_OPTIONS) })}</div>
        </div>

        <div className="sticky bottom-4 mt-8 flex items-center justify-end gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-xl backdrop-blur-md">
          <button type="button" onClick={() => setPrefs({})} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="h-4 w-4" /> {P.clear}</button>
          <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {P.save}
          </button>
        </div>
      </div>
    </main>
  );
}
