// components/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, Translation } from "@/lib/i18n";
import { DialogProvider } from "@/components/DialogProvider";
import { OptionTranslationsProvider } from "@/components/OptionTranslations";

// ---- Language Context ----
type LangContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translation;
};

const LangContext = createContext<LangContextType | null>(null);

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside Providers");
  return ctx;
}

// ---- Providers ----
export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("si");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "si" || saved === "en" || saved === "ta") {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l;
  };

  // 👇 මෙතන තමයි අපි වෙනස් කළේ: ThemeProvider එක හැම වෙලාවෙම එළියේ තියෙන්න ඕනේ
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {mounted ? (
        <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
          {/* 👇 Site එකේ ලස්සන confirm / alert popups */}
          <DialogProvider>
            {/* 👇 Profile details language එකට අනුව (values database එකෙන්) */}
            <OptionTranslationsProvider lang={lang}>{children}</OptionTranslationsProvider>
          </DialogProvider>
        </LangContext.Provider>
      ) : null}
    </ThemeProvider>
  );
}