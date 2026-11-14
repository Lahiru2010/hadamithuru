// app/pricing/page.tsx
// පැකේජ 3 (නොමිලේ / ගෝල්ඩ් / ප්ලැටිනම්)
"use client";

import Link from "next/link";
import { Check, Crown, Gem, Heart, Loader2, Lock, Sparkles, Tag } from "lucide-react";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import { usePricing } from "@/lib/usePricing";
import { periodPrice } from "@/lib/pricing";
import BoostCard from "@/components/BoostCard";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import VerifyOfferCard from "@/components/VerifyOfferCard";
import { setVerifiedHint, useVerifiedHint } from "@/lib/verified-hint";
import FoundingBadge from "@/components/FoundingBadge";
import { useRouter } from "next/navigation";
import { startCheckout } from "@/lib/payhere-client";
import { usePayConfig } from "@/lib/usePayConfig";

const ICONS = { free: Heart, gold: Crown, platinum: Gem };

export default function PricingPage() {
  const { t } = useLang();
  const P = t.plans;
  const { showAlert } = useDialog();
  const pricing = usePricing(); // 💰 Admin එකෙන් දාපු මිල ගණන් (නැත්නම් default)
  // 👇 මගේ Premium තත්ත්වය (Founding / verify තෑග්ග)
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<"gold" | "platinum" | null>(null); // 💳 update-67: ගෙවපු පැකේජය
  const [paying, setPaying] = useState<string | null>(null);
  const pay = usePayConfig(); // 💳 PayHere සකස් කරලාද (Vercel env vars)
  const router = useRouter();
  const [founding, setFounding] = useState(false);
  const [foundingNumber, setFoundingNumber] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  // 👇 මගේ තත්ත්වය load වෙනකම් offer / Founding කොටස පෙන්නන්නේ නෑ
  //    (කලින් verify වුණ අයටත් offer එක මුලින් පෙනිලා, load වුණාම නැති වුණා)
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  // ✅ update-59: Navbar එක කලින් දැනගත්ත "verify වෙලාද" තත්ත්වය — page එක එනකොටම offer එක පෙන්නන්න / හංගන්න
  //    ("1" = verified → හංගනවා · නැත්නම් කෙලින්ම පෙන්නනවා; පෙනිලා අතුරුදහන් වෙන්නේ නෑ)
  const verifiedHint = useVerifiedHint();
  useEffect(() => {
    const sb = createClient();
    sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      setLoggedIn(!!uid);
      if (uid) {
        const { data: p } = await sb.from("profiles").select("premium_until, founding_member, founding_number, id_verified").eq("id", uid).maybeSingle();
        // 👑 update-67: premium_plan column එක (SQL එක run කරලා නැත්නම් error එකක් — ඒක ගණන් ගන්නේ නෑ)
        sb.from("profiles").select("premium_plan").eq("id", uid).maybeSingle().then(({ data: pp }) => setPremiumPlan((pp?.premium_plan as "gold" | "platinum" | null) ?? null));
        if (p) {
          setPremiumUntil(p.premium_until ?? null);
          setFounding(!!p.founding_member);
          setFoundingNumber(p.founding_number ?? null);
          setVerified(p.id_verified === "Yes");
          setVerifiedHint(p.id_verified === "Yes");
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
  // 🗓️ update-66: හැම පැකේජයකටම admin තෝරපු එක කාලයයි (user තෝරන්නේ නෑ) — මාස 2+ නම් අඩු කිරීම
  const durOf = (months: number | null) => pricing.durations.find((d) => d.months === (months ?? 1)) ?? { months: months ?? 1, discountPct: 0, enabled: true };
  // 👑 දැන් සක්‍රිය පැකේජය (තෑගි Premium = Gold)
  const activePlan = premiumActive ? (premiumPlan ?? "gold") : null;

  // 💳 update-67: "ගෙවලා සක්‍රිය කරන්න" → PayHere
  const buy = async (item: "gold" | "platinum") => {
    if (!pay.enabled) return showAlert({ title: P.comingTitle, message: P.comingMsg });
    if (!loggedIn) return router.push("/login");
    setPaying(item);
    const r = await startCheckout(item);
    if (r === "redirecting") return; // PayHere page එකට යනවා
    setPaying(null);
    if (r === "login") return router.push("/login");
    if (r === "not_configured") return showAlert({ title: P.comingTitle, message: P.comingMsg });
    showAlert({ title: r === "too_many" ? P.tooMany : P.payError, tone: "error" });
  };
  const untilText = premiumUntil ? new Date(premiumUntil).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full pointer-events-none blur-[140px] bg-gradient-to-tr from-rose-200/80 via-red-50/80 to-rose-100/80 dark:from-rose-900/30 dark:via-orange-900/30 dark:to-pink-900/30" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{P.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{P.subtitle}</p>
        </header>

        {/* 👇 Founding / Premium තත්ත්වය — නැත්නම් (verify වෙලා නැත්නම් විතරක්) offer එක.
             update-59: Load වෙනකම් ඉන්නේ නෑ — verify වෙලා නැති අයට (සහ login නැති අයට) page එක එනකොටම පේනවා */}
        <div className="mt-10 min-h-[1px]">
          {!statusLoaded ? (verifiedHint !== "1" && <VerifyOfferCard showCta />) : founding || premiumActive ? (
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center font-semibold text-amber-800 animate-in fade-in dark:text-amber-300">
              {founding && <FoundingBadge variant="large" number={foundingNumber} />}
              {premiumActive && <span>{t.offer.premiumActive.replace("{date}", new Date(premiumUntil as string).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }))}</span>}
            </div>
          ) : (
            !verified && <VerifyOfferCard showCta />
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
                {plan.id === activePlan ? (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-green-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Check className="h-3.5 w-3.5" /> {P.activeBadge}
                  </span>
                ) : featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D52047] to-[#F05160] px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Sparkles className="h-3.5 w-3.5" /> {P.popular}
                  </span>
                )}
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}><Icon className="h-6 w-6" /></span>
                <h2 className="mt-5 text-2xl font-bold text-foreground">{name}</h2>
                {plan.id === "free" ? (
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-foreground">LKR 0</span>
                    <span className="text-sm text-muted-foreground">{P.forever}</span>
                  </p>
                ) : (() => {
                  // 💰 admin තෝරපු කාලයට මුළු මිල (අඩු කිරීමත් එක්ක)
                  const dur = durOf(plan.months);
                  const pr = periodPrice(plan.priceLkr, dur);
                  return (
                    // 🏷️ update-68: අඩු කිරීම පැහැදිලිව — උඩින් "% අඩුවෙන් · LKR x ඉතුරුයි", මැද ලොකු මිල, යටින් කපපු මිල + මාසයකට
                    <div className="mt-3">
                      {dur.discountPct > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-green-500/25 dark:text-green-400">
                          <Tag className="h-3.5 w-3.5" /> {P.off.replace("{p}", String(dur.discountPct))} · {P.save.replace("{x}", (pr.full - pr.total).toLocaleString())}
                        </span>
                      )}
                      <p className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-1 ${dur.discountPct > 0 ? "mt-2.5" : ""}`}>
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">LKR {pr.total.toLocaleString()}</span>
                        <span className="text-sm font-medium text-muted-foreground">{dur.months === 1 ? P.perMonth : P.perMonths.replace("{n}", String(dur.months))}</span>
                      </p>
                      {dur.discountPct > 0 && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                          <span className="line-through decoration-red-500/70">LKR {pr.full.toLocaleString()}</span>
                          <span aria-hidden className="text-border">•</span>
                          <span>{P.perMonthApprox.replace("{x}", pr.perMonth.toLocaleString())}</span>
                        </p>
                      )}
                    </div>
                  );
                })()}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {P[f as keyof typeof P]}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  // 👤 update-59: Login වෙලා නම් "නොමිලේ පටන් ගන්න" වෙනුවට "ඔබ දැනට ඉන්නේ මෙම පැකේජයේ"
                  loggedIn ? (
                    !premiumActive && (
                      <p className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-center font-semibold text-green-700 dark:text-green-400">
                        <Check className="h-4 w-4" /> {P.yourPlan}
                      </p>
                    )
                  ) : (
                    <Link href="/register" className="mt-8 rounded-xl border border-border py-3 text-center font-semibold transition hover:border-primary/50 hover:text-primary">{P.current}</Link>
                  )
                ) : plan.id === activePlan ? (
                  // 👑 update-65/67: මේ පැකේජය දැනටමත් සක්‍රිය නම් — ඉවර වෙන දිනය + (ගෙවීම් තියෙනවා නම්) තව කාලයක් එකතු කරන්න
                  <div className="mt-8 space-y-2">
                    <p className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-3 text-center text-sm font-bold text-green-700 dark:text-green-400">
                      {P.planActive.replace("{date}", untilText)}
                    </p>
                    {pay.enabled && (
                      <button type="button" disabled={!!paying} onClick={() => buy(plan.id as "gold" | "platinum")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60">
                        {paying === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {paying === plan.id ? P.redirecting : P.extend}
                      </button>
                    )}
                  </div>
                ) : plan.id === "gold" && activePlan === "platinum" ? (
                  // 💎 Platinum සක්‍රියයි → Gold එක ඒකේ ඇතුළත් (අමුතුවෙන් ගන්න ඕනේ නෑ)
                  <p className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-center text-sm font-semibold text-muted-foreground">
                    <Check className="h-4 w-4" /> {P.platinumName} ✓
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={!!paying}
                    onClick={() => buy(plan.id as "gold" | "platinum")}
                    className={`mt-8 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition disabled:opacity-70 ${featured ? "bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white shadow-lg shadow-primary/20 hover:opacity-90" : "border border-primary/40 text-primary hover:bg-primary/5"}`}
                  >
                    {paying === plan.id ? <><Loader2 className="h-4 w-4 animate-spin" /> {P.redirecting}</> : pay.enabled ? <><Lock className="h-4 w-4" /> {P.payNow}</> : P.choose}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔒 update-67: ගෙවීම් ගැන විශ්වාසය (PayHere) */}
        {pay.enabled && (
          <div className="mx-auto mt-8 max-w-3xl space-y-2 text-center">
            <p className="text-sm text-muted-foreground">{P.payNote}</p>
            {pay.sandbox && <p className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">{P.sandboxNote}</p>}
          </div>
        )}

        {/* ⚡ Profile Boost */}
        {pricing.boost.enabled && <BoostCard boost={pricing.boost} />}

      </div>
    </main>
  );
}
