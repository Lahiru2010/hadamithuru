// components/LegalPage.tsx — භාවිත නියමයන් / පෞද්ගලිකත්ව ප්‍රතිපත්තිය පිටු දෙකටම පොදු layout එක
"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { useLang } from "@/components/providers";
import { LEGAL_UPDATED, PRIVACY, TERMS } from "@/lib/legal";

export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, lang } = useLang();
  const E = t.extra;
  const sections = (kind === "terms" ? TERMS : PRIVACY)[lang] ?? (kind === "terms" ? TERMS : PRIVACY).en;
  const brand = (x: string) => x.replaceAll("{brand}", t.brand);
  const Icon = kind === "terms" ? FileText : ShieldCheck;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <header>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#F0544F] text-white shadow-lg shadow-primary/25"><Icon className="h-7 w-7" /></span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground">{kind === "terms" ? E.terms : E.privacy}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{E.lastUpdated.replace("{date}", LEGAL_UPDATED)}</p>
        </header>
        <ol className="mt-10 space-y-5">
          {sections.map(([title, body], i) => (
            <li key={title} id={title.includes("🍪") ? "cookies" : undefined} className="scroll-mt-24 rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h2 className="flex items-start gap-3 text-lg font-bold text-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm text-primary">{i + 1}</span>
                {brand(title)}
              </h2>
              <p className="mt-2 pl-10 leading-relaxed text-muted-foreground">{brand(body)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-xs text-muted-foreground">{E.legalNote}</p>
      </div>
    </main>
  );
}
