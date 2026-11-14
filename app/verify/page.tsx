// app/verify/page.tsx
// "තහවුරු වන්න" — checklist එක + හැඳුනුම්පත් photos upload කරන්න
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Camera, Check, Clock, Loader2, Lock, ShieldCheck, X as XIcon, AlertCircle } from "lucide-react";
import imageCompression from "browser-image-compression";
import { useLang } from "@/components/providers";
import VerifyOfferCard from "@/components/VerifyOfferCard";

type Status = { checklist: { email: boolean; phone: boolean; photo: boolean; id: boolean }; request: { status: string; admin_note?: string | null } | null };
type Slot = "front" | "back" | "selfie";

export default function VerifyPage() {
  const { t } = useLang();
  const X = t.extra;
  const [status, setStatus] = useState<Status | null>(null);
  const [docType, setDocType] = useState<"nic" | "passport" | "license">("nic");
  const [files, setFiles] = useState<Partial<Record<Slot, { file: File; url: string }>>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetch("/api/verify", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setStatus(d));
  useEffect(() => { load(); }, []);

  const pick = async (slot: Slot, f?: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    const small = await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1800, useWebWorker: true }).catch(() => f);
    setFiles((x) => ({ ...x, [slot]: { file: small, url: URL.createObjectURL(small) } }));
  };

  const needBack = docType !== "passport";
  const ready = !!files.front && (!needBack || !!files.back);

  const submit = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    const fd = new FormData();
    fd.append("docType", docType);
    fd.append("front", files.front!.file);
    if (needBack && files.back) fd.append("back", files.back.file);
    const res = await fetch("/api/verify", { method: "POST", body: fd });
    setSending(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? "Upload failed");
    setFiles({});
    load();
  };

  const checklist = status ? [
    { ok: status.checklist.email, label: X.vpEmail },
    { ok: status.checklist.phone, label: X.vpPhone, href: "/profile" },
    { ok: status.checklist.photo, label: X.vpPhoto, href: "/profile" },
    { ok: status.checklist.id, label: X.vpId, pending: !status.checklist.id && status.request?.status === "pending" },
  ] : [];
  const req = status?.request;
  const verified = status?.checklist.id;
  const pending = req?.status === "pending";

  const slot = (key: Slot, label: string, hint?: string) => (
    <label className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/20 transition hover:border-primary/50">
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(key, e.target.files?.[0])} />
      <span className="relative flex aspect-[4/3] items-center justify-center bg-muted/40">
        {files[key] ? <img src={files[key]!.url} alt="" className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary" />}
        {files[key] && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"><Check className="h-4 w-4" /></span>}
      </span>
      <span className="p-3 text-sm font-semibold">{label}{hint && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span>}</span>
    </label>
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <header className="text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/30"><BadgeCheck className="h-8 w-8" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground">{X.verifyTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{X.verifySubtitle}</p>
        </header>

        {/* 🎁 Offer එක — තහවුරු වෙලා නැත්නම් විතරයි */}
        {status && !status.checklist.id && <VerifyOfferCard className="mt-8" />}

        {/* Checklist */}
        <section className="mt-10 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
          <h2 className="font-bold text-foreground">{X.verifyPoints}</h2>
          {!status ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted" /> : (
            <ul className="mt-4 space-y-3">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-3">
                  {/* 👇 ✓ කොළ = හරි, ⏳ කහ = පරීක්ෂා කරමින්, හිස් රවුම = තවම නෑ */}
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-green-500 text-white" : "pending" in c && c.pending ? "bg-amber-500 text-white" : "border-2 border-border text-muted-foreground"}`}>
                    {c.ok ? <Check className="h-4 w-4" /> : "pending" in c && c.pending ? <Clock className="h-4 w-4" /> : null}
                  </span>
                  <span className={c.ok ? "font-medium text-foreground" : "text-muted-foreground"}>{c.label}</span>
                  {"pending" in c && c.pending && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">{t.extra.pendingReview}</span>}
                  {!c.ok && c.href && <Link href={c.href} className="ml-auto text-sm font-semibold text-primary hover:underline">→</Link>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* තත්ත්වය */}
        {verified ? (
          <p className="mt-6 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 font-semibold text-green-700 dark:text-green-400"><BadgeCheck className="h-6 w-6 shrink-0" /> {X.statusApproved}</p>
        ) : pending ? (
          <>
            <p className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 font-semibold text-amber-700 dark:text-amber-400"><Clock className="h-6 w-6 shrink-0" /> {X.statusPending}</p>
            {/* 👇 Admin පොඩි දෙයක් හදන්න කියලා තියෙනවා නම් (ඉල්ලීම තවම pending) */}
            {req?.admin_note && (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-background p-5 text-sm shadow-sm">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-foreground">{X.adminMessageTitle}</p>
                  <p className="mt-1.5 whitespace-pre-line leading-relaxed text-muted-foreground">{req.admin_note}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{X.replySupport}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <section className="mt-6 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
            {req?.status === "rejected" && (
              <p className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="whitespace-pre-line"><span className="font-semibold">{X.statusRejected}</span> {req.admin_note ? `“${req.admin_note}” ` : ""}{X.resubmit}</span>
              </p>
            )}
            <p className="text-sm font-semibold">{X.docType}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([["nic", X.docNic], ["passport", X.docPassport], ["license", X.docLicense]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setDocType(v)} className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${docType === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{l}</button>
              ))}
            </div>
            <div className={`mt-5 grid gap-4 ${needBack ? "sm:grid-cols-2" : "sm:max-w-xs"}`}>
              {slot("front", X.docFront)}
              {needBack && slot("back", X.docBack)}
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {X.idPrivate}</p>
            {error && <p className="mt-3 flex items-center gap-2 text-sm text-red-500"><XIcon className="h-4 w-4" /> {error}</p>}
            <button type="button" onClick={submit} disabled={!ready || sending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] py-3.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-50">
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} {X.submitVerify}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
