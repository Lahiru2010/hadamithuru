// app/pricing/page.tsx
// පැකේජ 3 (නොමිලේ / ගෝල්ඩ් / ප්ලැටිනම්)
"use client";

import Link from "next/link";
import { Check, Crown, Gem, Heart, Sparkles } from "lucide-react";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import { usePricing } from "@/lib/usePricing";
import BoostCard from "@/components/BoostCard";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import VerifyOfferCard from "@/components/VerifyOfferCard";
import FoundingBadge from "@/components/FoundingBadge";

const ICONS = { free: Heart, gold: Crown, platinum: Gem };

export default function PricingPage() {
  const { t } = useLang();
  const P = t.plans;
  const { showAlert } = useDialog();
  const pricing = usePricing(); // 💰 Admin එකෙන් දාපු මිල ගණන් (නැත්නම් default)
  // 👇 මගේ Premium තත්ත්වය (Founding / verify තෑග්ග)
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [founding, setFounding] = useState(false);
  const [foundingNumber, setFoundingNumber] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  // 👇 මගේ තත්ත්වය load වෙනකම් offer / Founding කොටස පෙන්නන්නේ නෑ
  //    (කලින් verify වුණ අයටත් offer එක මුලින් පෙනිලා, load වුණාම නැති වුණා)
  const [statusLoaded, setStatusLoaded] = useState(false);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (uid) {
        const { data: p } = await sb.from("profiles").select("premium_until, founding_member, founding_number, id_verified").eq("id", uid).maybeSingle();
        if (p) {
          setPremiumUntil(p.premium_until ?? null);
          setFounding(!!p.founding_member);
          setFoundingNumber(p.founding_number ?? null);
          setVerified(p.id_verified === "Yes");
        } else {
          // SQL එක තාම run කරලා නැත්නම් (columns නෑ) — verify තත්ත්වය විතරක් ගන්නවා
          const { data: v } = await sb.from("profiles").select("id_verified").eq("id", uid).maybeSingle();
          setVerified(v?.id_verified === "Yes");
        }
      }
      setStatusLoaded(true);
    });
  }, []);
  const premiumActive = !!premiumUntil && new Date(premiumUntil) > new Date();

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full pointer-events-none blur-[140px] bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{P.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{P.subtitle}</p>
        </header>

        {/* 👇 Founding / Premium තත්ත්වය — නැත්නම් (verify වෙලා නැත්නම් විතරක්) offer එක. Load වෙනකම් හිස් ඉඩක් */}
        <div className="mt-10 min-h-[1px]">
          {!statusLoaded ? null : founding || premiumActive ? (
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center font-semibold text-amber-800 animate-in fade-in dark:text-amber-300">
              {founding && <FoundingBadge variant="large" number={foundingNumber} />}
              {premiumActive && <span>{t.offer.premiumActive.replace("{date}", new Date(premiumUntil as string).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }))}</span>}
            </div>
          ) : (
            !verified && <VerifyOfferCard showCta className="animate-in fade-in" />
          )}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {pricing.plans.filter((p) => p.enabled !== false).map((plan) => {
            const Icon = ICONS[plan.id];
            const name = P[`${plan.id}Name` as const];
            const featured = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  featured ? "border-primary bg-gradient-to-b from-primary/10 to-background shadow-primary/10 md:-my-3 md:py-11" : "border-border/60 bg-background"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D52047] to-[#F05160] px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" /> {P.popular}
                  </span>
                )}
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}><Icon className="h-6 w-6" /></span>
                <h2 className="mt-5 text-2xl font-bold text-foreground">{name}</h2>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-foreground">{plan.priceLkr === 0 ? "LKR 0" : `LKR ${plan.priceLkr.toLocaleString()}`}</span>
                  <span className="text-sm text-muted-foreground">{plan.months === 1 ? P.perMonth : plan.months ? P.perMonths.replace("{n}", String(plan.months)) : P.forever}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {P[f as keyof typeof P]}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Link href="/register" className="mt-8 rounded-xl border border-border py-3 text-center font-semibold transition hover:border-primary/50 hover:text-primary">{P.current}</Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => showAlert({ title: P.comingTitle, message: P.comingMsg })}
                    className={`mt-8 rounded-xl py-3 font-semibold transition ${featured ? "bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white shadow-lg shadow-primary/20 hover:opacity-90" : "border border-primary/40 text-primary hover:bg-primary/5"}`}
                  >
                    {P.choose}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ⚡ Profile Boost */}
        {pricing.boost.enabled && <BoostCard boost={pricing.boost} />}

        <p className="mt-10 text-center text-xs text-muted-foreground">{P.note}</p>
      </div>
    </main>
  );
}
