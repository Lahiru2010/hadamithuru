// app/not-found.tsx — 🧭 404: page එක හොයාගන්න බැහැ (UX-friendly — ආපහු යන්න පාරවල් එක්ක)
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, HeartCrack, Home, LifeBuoy, Search } from "lucide-react";
import { useLang } from "@/components/providers";

export default function NotFound() {
  const { t } = useLang();
  const N = t.notFound;
  const router = useRouter();
  return (
    <main className="relative flex min-h-[calc(100dvh-var(--nav-h,73px))] items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-200/70 via-red-50/70 to-rose-100/70 blur-[120px] dark:from-rose-900/30 dark:via-transparent dark:to-pink-900/20" />
      <div className="relative w-full max-w-xl text-center">
        <p className="bg-gradient-to-r from-[#D52047] to-[#AD032A] bg-clip-text text-[7rem] font-extrabold leading-none tracking-tight text-transparent md:text-[9rem]">404</p>
        <span className="mx-auto -mt-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-xl ring-1 ring-border"><HeartCrack className="h-8 w-8 text-primary" /></span>
        <h1 className="mt-6 text-2xl font-extrabold md:text-3xl">{N.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{N.text}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D52047] to-[#AD032A] px-7 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 sm:w-auto"><Home className="h-5 w-5" /> {N.home}</Link>
          <Link href="/browse" className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 font-semibold transition hover:border-primary/50 hover:text-primary sm:w-auto"><Search className="h-5 w-5" /> {t.home.findMatch}</Link>
        </div>
        <div className="mt-6 flex items-center justify-center gap-5 text-sm">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> {N.back}</button>
          <Link href="/help" className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-primary"><LifeBuoy className="h-4 w-4" /> {t.help.navLabel}</Link>
        </div>
      </div>
    </main>
  );
}
