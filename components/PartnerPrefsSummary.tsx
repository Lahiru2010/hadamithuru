// components/PartnerPrefsSummary.tsx — 💞 update-68: "මගේ ගිණුම" සමාලෝචනයේ "මම කැමති සහකරු" සාරාංශය
// profiles.partner_prefs (jsonb) — දාලා නැත්නම් /preferences එකට යන්න පොළඹවනවා
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Pencil } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useTr } from "@/components/OptionTranslations";
import type { PartnerPrefs } from "@/lib/match";

export default function PartnerPrefsSummary({ userId, editLabel }: { userId: string; editLabel: string }) {
  const { t } = useLang();
  const P = t.prefs;
  const tr = useTr();
  const [prefs, setPrefs] = useState<PartnerPrefs | null | undefined>(undefined); // undefined = load වෙනවා

  useEffect(() => {
    let active = true;
    createClient().from("profiles").select("partner_prefs").eq("id", userId).maybeSingle()
      .then(({ data }) => active && setPrefs((data?.partner_prefs as PartnerPrefs | null) ?? null), () => active && setPrefs(null));
    return () => { active = false; };
  }, [userId]);

  const list = (v?: string[]) => (v && v.length ? v.map((x) => String(tr(x))).join(", ") : "");
  const range = (a?: string | number, b?: string | number) => (a || b ? `${a ?? "…"} – ${b ?? "…"}` : "");
  const rows: [string, string][] = prefs
    ? ([
        [P.age, range(prefs.ageMin, prefs.ageMax)],
        [P.height, range(prefs.heightMin, prefs.heightMax)],
        [P.religion, list(prefs.religions)],
        [P.motherTongue, list(prefs.motherTongues)],
        [P.civilStatus, list(prefs.civilStatus)],
        [P.educationMin, prefs.educationMin ? String(tr(prefs.educationMin)) : ""],
        [P.food, prefs.food ? String(tr(prefs.food)) : ""],
        [P.smoking, prefs.smoking ? String(tr(prefs.smoking)) : ""],
        [P.drinking, prefs.drinking ? String(tr(prefs.drinking)) : ""],
        [P.districts, list(prefs.districts)],
      ] as [string, string][]).filter(([, v]) => v)
    : [];

  return (
    <div className="rounded-2xl border border-border p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary"><HeartHandshake className="h-4 w-4" /> {P.title}</h3>
        {rows.length > 0 && (
          <Link href="/preferences" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
            <Pencil className="h-3.5 w-3.5" /> {editLabel}
          </Link>
        )}
      </div>
      {prefs === undefined ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : rows.length === 0 ? (
        // 👇 තාම දාලා නැත්නම් — දාන්න පොළඹවනවා
        <Link href="/preferences" className="group flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 transition hover:border-primary hover:bg-primary/10">
          <span className="min-w-0 flex-1 text-sm text-foreground">{P.reviewEmpty}</span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">{P.reviewCta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
        </Link>
      ) : (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 md:grid-cols-3">
          {rows.map(([label, value]) => {
            const long = value.length > 28;
            return (
              <div key={label} className={`min-w-0 ${long ? "col-span-2 md:col-span-3" : ""}`}>
                <dt className="text-[10.5px] font-medium uppercase leading-4 tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 break-words text-[14.5px] font-semibold leading-snug">{value}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
