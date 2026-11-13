// components/OptionTranslations.tsx
// Profile details වල values (Male, Hindu, Divorced, Accountant, Galle...) තෝරපු language එකට පරිවර්තනය කරනවා.
// පරිවර්තන එන්නේ Supabase එකේ `option_translations` table එකෙන් — code එකේ hardcode කරලා නෑ.
// අලුත් value එකක් එකතු කරන්න / පරිවර්තනයක් වෙනස් කරන්න ඕන නම් ඒ table එකේ row එකක් එකතු / වෙනස් කරන්න.
//
// පාවිච්චි කරන විදිහ:
//   const tr = useTr();
//   <p>{tr(profile.religion)}</p>     // "Hindu" → "හින්දු" (සිංහල තෝරලා නම්)
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/client";
import type { Language } from "@/lib/i18n";

type Row = { value: string; en: string | null; si: string | null; ta: string | null };
type TranslateFn = <T extends string | number | null | undefined>(value: T) => T | string;

const STORAGE_KEY = "option_translations_v1";

// Page එකෙන් page එකට යනකොට ආයේ database එකෙන් ගන්නේ නැති වෙන්න memory එකේ තියාගන්නවා
let memoryCache: Row[] | null = null;

function readStoredRows(): Row[] {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Row[]) : [];
  } catch {
    return [];
  }
}

const TranslateContext = createContext<TranslateFn | null>(null);

export function OptionTranslationsProvider({ lang, children }: { lang: Language; children: React.ReactNode }) {
  // කලින් save කරපු පරිවර්තන තියෙනවා නම් ඒවා ක්ෂණිකව පාවිච්චි කරනවා, පිටිපස්සෙන් අලුත් ඒවා ගන්නවා
  const [rows, setRows] = useState<Row[]>(readStoredRows);

  useEffect(() => {
    if (memoryCache) return;
    createClient()
      .from("option_translations")
      .select("value, en, si, ta")
      .then(({ data }) => {
        if (!data) return;
        memoryCache = data as Row[];
        setRows(memoryCache);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
        } catch {}
      });
  }, []);

  // "Hindu", "hindu", " Hindu " ඔක්කොම එකම විදිහට හොයාගන්න lowercase key එකක්
  const map = useMemo(() => {
    const m = new Map<string, Row>();
    for (const r of rows) m.set(r.value.trim().toLowerCase(), r);
    return m;
  }, [rows]);

  const tr = useCallback<TranslateFn>(
    (value) => {
      if (value === null || value === undefined || value === "") return value;
      const text = String(value);
      const row = map.get(text.trim().toLowerCase());
      // පරිවර්තනයක් නැත්නම් මුල් value එකම පෙන්නනවා
      return (row && (row[lang] || row.en)) || text;
    },
    [map, lang]
  );

  return <TranslateContext.Provider value={tr}>{children}</TranslateContext.Provider>;
}

/** Profile values පරිවර්තනය කරන function එක */
export function useTr(): TranslateFn {
  const tr = useContext(TranslateContext);
  return tr ?? ((value) => value);
}
