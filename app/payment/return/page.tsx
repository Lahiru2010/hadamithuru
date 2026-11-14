// app/payment/return/page.tsx — 💳 update-67: PayHere එකෙන් ආපහු ආවම
// ?order_id=HM-...            → ගෙවීම තහවුරු වෙනකම් (PayHere notify එක) තත්පර 2න් 2ට බලනවා
// ?order_id=HM-...&cancelled=1 → user "Cancel" කළා
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Crown, Loader2, XCircle, Zap } from "lucide-react";
import { useLang } from "@/components/providers";

type Status = { status: "pending" | "paid" | "failed" | "cancelled" | "chargeback"; item: "gold" | "platinum" | "boost"; grantedUntil: string | null };

function ReturnInner() {
  const { t } = useLang();
  const R = t.payment;
  const sp = useSearchParams();
  const order = sp.get("order_id") ?? "";
  const cancelled = sp.get("cancelled") === "1";
  const [st, setSt] = useState<Status | null>(null);
  const [phase, setPhase] = useState<"checking" | "done" | "slow" | "error">(cancelled ? "done" : "checking");
  const tries = useRef(0);

  useEffect(() => {
    if (!order) return void setPhase("error");
    if (cancelled) {
      fetch("/api/pay/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order, cancelled: true }) }).catch(() => {});
      return;
    }
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      tries.current += 1;
      const r = await fetch(`/api/pay/status?order=${encodeURIComponent(order)}`, { cache: "no-store" }).catch(() => null);
      if (stop) return;
      if (r?.ok) {
        const d = (await r.json()) as Status;
        setSt(d);
        if (d.status !== "pending") return setPhase("done");
      } else if (r && r.status !== 404 && tries.current > 3) {
        return setPhase("error");
      }
      // ⏳ තත්පර 40ක් බලනවා — ඊට පස්සේ "තාම තහවුරු වෙමින්" (notify එක පස්සේ ආවත් 🔔 notification එකක් එනවා)
      if (tries.current >= 20) return setPhase("slow");
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => { stop = true; clearTimeout(timer); };
  }, [order, cancelled]);

  const date = st?.grantedUntil ? new Date(st.grantedUntil).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "";
  const planName = st?.item === "platinum" ? t.plans.platinumName : t.plans.goldName;

  let icon = <Loader2 className="h-14 w-14 animate-spin text-primary" />;
  let title = R.checkingTitle;
  let text: string = R.checkingText;
  let tone: "ok" | "wait" | "bad" | "neutral" = "neutral";
  if (cancelled || st?.status === "cancelled") {
    icon = <XCircle className="h-14 w-14 text-muted-foreground" />; title = R.cancelledTitle; text = R.cancelledText; tone = "neutral";
  } else if (st?.status === "paid") {
    icon = st.item === "boost" ? <Zap className="h-14 w-14 fill-amber-400 text-amber-500" /> : <Crown className="h-14 w-14 text-amber-500" />;
    title = R.successTitle;
    text = st.item === "boost" ? R.successBoost.replace("{date}", date) : R.successPlan.replace("{plan}", planName).replace("{date}", date);
    tone = "ok";
  } else if (st?.status === "failed" || st?.status === "chargeback" || phase === "error") {
    icon = <XCircle className="h-14 w-14 text-red-500" />; title = R.failedTitle; text = R.failedText; tone = "bad";
  } else if (phase === "slow") {
    icon = <Clock className="h-14 w-14 text-amber-500" />; title = R.pendingTitle; text = R.pendingText; tone = "wait";
  }

  return (
    <main className="relative min-h-[80vh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-rose-200/70 via-amber-50/70 to-rose-100/70 blur-[130px] dark:from-rose-900/25 dark:via-amber-900/20 dark:to-pink-900/25" />
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
        <div className="w-full rounded-[2rem] border border-border bg-background p-7 shadow-xl shadow-primary/5 sm:p-10">
          <div className="flex justify-center">{icon}</div>
          <h1 className="mt-5 text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{text}</p>
          {tone === "ok" && <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-green-700 dark:text-green-400"><CheckCircle2 className="h-4 w-4" /> {R.receipt}</p>}
          {order && (tone === "bad" || tone === "wait") && (
            <p className="mt-4 rounded-xl bg-muted/60 px-4 py-2 text-sm">
              {R.orderNo}: <span className="select-all font-mono font-bold">{order}</span>
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {tone === "ok" || tone === "wait" ? (
              <Link href="/browse" className="rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90">{R.goBrowse}</Link>
            ) : cancelled || tone === "bad" ? (
              <Link href="/pricing" className="rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 hover:opacity-90">{R.tryAgain}</Link>
            ) : null}
            {(tone === "bad" || tone === "wait") && (
              <Link href="/contact" className="rounded-xl border border-border px-6 py-3 font-semibold transition hover:border-primary/50 hover:text-primary">{R.contact}</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>}>
      <ReturnInner />
    </Suspense>
  );
}
