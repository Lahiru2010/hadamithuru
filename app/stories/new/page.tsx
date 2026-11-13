// app/stories/new/page.tsx — 💍 අපේ ආදර කතාව බෙදාගන්න (පියවර 4: සහකරු → කතාව → ඡායාරූපය → තහවුරු කිරීම)
// • සහකරු Seneha හරහාම ගැලපුණු කෙනෙක් වෙන්නම ඕනේ · "විවාහ වෙලා / ගිවිස ගෙන" තහවුරු කරන්න ඕනේ
// • යැව්වාම සහකරුට 🔔 "තහවුරු කරන්න" → දෙදෙනාම එකඟ වුණාම admin පළ කරනවා
"use client";

import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { ArrowLeft, ArrowRight, Camera, Check, Clock, HeartHandshake, Loader2, Send, X } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import TownCombobox from "@/components/form/TownCombobox";
import AvatarImage from "@/components/AvatarImage";
import { withFastAvatars } from "@/lib/avatar-client";

type Match = { id: string; full_name: string; avatar_url?: string | null };
type Mine = { id: string; names: string; status: "pending" | "approved" | "rejected"; partner_confirmed_at: string | null; created_at: string };

export default function NewStoryPage() {
  const { t } = useLang();
  const S = t.stories;
  const { showAlert } = useDialog();
  const [step, setStep] = useState(0);
  const [myName, setMyName] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [mine, setMine] = useState<Mine[]>([]);
  const [form, setForm] = useState({ partnerId: "", names: "", place: "", year: String(new Date().getFullYear()), story: "", consent: false, married: false });
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const sb = createClient();
    const { data } = await sb.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const [{ data: me }, { data: acc }, { data: st }] = await Promise.all([
      sb.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      sb.from("interests").select("sender_id, receiver_id").in("status", ["accepted", "removed"]).or(`sender_id.eq.${uid},receiver_id.eq.${uid}`),
      sb.from("success_stories").select("*").order("created_at", { ascending: false }),
    ]);
    setMyName(String(me?.full_name ?? "").split(" ")[0] ?? "");
    const ids = [...new Set((acc ?? []).map((r) => (r.sender_id === uid ? r.receiver_id : r.sender_id)))];
    if (ids.length) {
      const { data: ps } = await sb.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      setMatches(await withFastAvatars((ps ?? []) as Match[]));
    } else setMatches([]);
    setMine(((st ?? []) as Mine[]).filter((x) => x));
  };
  useEffect(() => { const id = setTimeout(load, 0); return () => clearTimeout(id); }, []);

  const choosePartner = (m: Match) => {
    setForm((f) => ({ ...f, partnerId: m.id, names: f.names || `${myName} ❤ ${String(m.full_name).split(" ")[0]}` }));
    setStep(1);
  };
  const pickPhoto = async (f?: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    const small = await imageCompression(f, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true }).catch(() => f);
    setPhoto({ file: small, url: URL.createObjectURL(small) });
  };
  const submit = async () => {
    setSending(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (photo) fd.append("photo", photo.file);
    const res = await fetch("/api/stories", { method: "POST", body: fd });
    setSending(false);
    if (!res.ok) { const d = await res.json().catch(() => null); return showAlert({ title: S.error, message: d?.error, tone: "error" }); }
    showAlert({ title: S.sent, tone: "success" });
    setForm({ partnerId: "", names: "", place: "", year: String(new Date().getFullYear()), story: "", consent: false, married: false });
    setPhoto(null);
    setStep(0);
    load();
  };

  const partner = matches?.find((m) => m.id === form.partnerId);
  const steps = [S.step1, S.step2, S.step3, S.step4];
  const canNext = [!!form.partnerId, form.names.trim().length >= 3 && form.story.trim().length >= 30, true, form.married && form.consent][step];
  const input = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/25"><HeartHandshake className="h-7 w-7" /></span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{S.title}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">{S.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* 🪜 Stepper card */}
          <section className="rounded-3xl border border-border bg-background shadow-sm">
            <ol className="flex items-center gap-2 border-b border-border p-5">
              {steps.map((label, i) => (
                <li key={label} className="flex flex-1 items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/15" : "bg-muted text-muted-foreground"}`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
                  <span className={`hidden truncate text-sm font-semibold sm:inline ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  {i < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-primary" : "bg-border"}`} />}
                </li>
              ))}
            </ol>

            <div className="p-6">
              {/* 1 — සහකරු */}
              {step === 0 && (
                matches === null ? <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted-foreground" /> : matches.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{S.noMatches}</p>
                ) : (
                  <>
                    <h2 className="font-bold">{S.pickPartner}</h2>
                    <p className="mb-4 text-sm text-muted-foreground">{S.pickHint}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {matches.map((m) => (
                        <button key={m.id} type="button" onClick={() => choosePartner(m)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50 ${form.partnerId === m.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border"}`}>
                          <AvatarImage src={m.avatar_url ?? undefined} alt={m.full_name} shape="rounded-xl" className="h-12 w-12" />
                          <span className="min-w-0 flex-1 truncate font-semibold">{m.full_name}</span>
                          {form.partnerId === m.id && <Check className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </>
                )
              )}

              {/* 2 — කතාව */}
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold">{S.names}<input maxLength={80} value={form.names} onChange={(e) => setForm({ ...form, names: e.target.value })} className={`mt-1.5 ${input}`} /></label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 👇 ප්‍රදේශය — site එකේ search එක්ක dropdown එක (නගර list එක) */}
                    <div className="block text-sm font-semibold">{S.place}<div className="mt-1.5"><TownCombobox value={form.place} onChange={(v) => setForm({ ...form, place: v })} /></div></div>
                    <label className="block text-sm font-semibold">{S.year}<input type="number" min={2020} max={2100} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={`mt-1.5 ${input}`} /></label>
                  </div>
                  <label className="block text-sm font-semibold">{S.story}
                    <textarea maxLength={700} rows={7} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} className={`mt-1.5 resize-y ${input}`} />
                    <span className={`mt-1 block text-right text-xs ${form.story.trim().length < 30 ? "text-muted-foreground" : "text-green-600"}`}>{S.storyHint} · {form.story.length}/700</span>
                  </label>
                </div>
              )}

              {/* 3 — ඡායාරූපය */}
              {step === 2 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">{S.photo}</p>
                  {photo ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setPhoto(null)} aria-label="Remove" className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickPhoto(e.dataTransfer.files?.[0]); }} className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Camera className="h-7 w-7" /></span>
                      <span className="text-sm font-semibold">{S.photo}</span>
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              )}

              {/* 4 — තහවුරු කිරීම + පෙරදසුන */}
              {step === 3 && (
                <div className="space-y-4">
                  <article className="overflow-hidden rounded-2xl border border-border">
                    {photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo.url} alt="" className="aspect-[16/9] w-full object-cover" />}
                    <div className="p-4">
                      <p className="font-bold">{form.names} <span className="text-sm font-normal text-muted-foreground">{[form.place, form.year].filter(Boolean).join(" · ")}</span></p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{form.story}</p>
                    </div>
                  </article>
                  {[["married", S.married], ["consent", S.consent]].map(([k, label]) => (
                    <label key={k} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                      <input type="checkbox" checked={form[k as "married" | "consent"]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D61F55]" /> {label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ◀ ▶ */}
            <div className="flex items-center justify-between gap-3 border-t border-border p-5">
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:invisible"><ArrowLeft className="h-4 w-4" /> {S.back}</button>
              {step < 3 ? (
                <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-40">{S.next} <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={submit} disabled={!canNext || sending} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {S.submit}</button>
              )}
            </div>
          </section>

          {/* ℹ️ වැඩ කරන විදිහ + මම එවපු කතා */}
          <aside className="space-y-6">
            {/* 🎁 තෑග්ග — කැපී පේන්න */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] p-6 text-white shadow-xl shadow-primary/20">
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl motion-safe:animate-[float_4s_ease-in-out_infinite]">🎁</span>
              <h2 className="relative mt-4 text-xl font-extrabold leading-snug">{S.giftTitle}</h2>
              <p className="relative mt-2 text-sm leading-relaxed text-white/85">{S.giftText}</p>
            </section>
            <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
              <h2 className="mb-4 font-bold">{S.flowTitle}</h2>
              <ol className="space-y-4">
                {[S.flow1, S.flow2, S.flow3].map((f, i) => (
                  <li key={f} className="flex gap-3 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><span className="pt-1">{f}</span></li>
                ))}
              </ol>
              {partner && <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">💞 {partner.full_name}</p>}
            </section>
            {mine.length > 0 && (
              <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
                <h2 className="mb-4 font-bold">{S.mine}</h2>
                <ul className="space-y-3">
                  {mine.map((m) => {
                    const st = m.status;
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{m.names}</span>
                        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${st === "approved" ? "bg-green-500/10 text-green-700 dark:text-green-400" : st === "rejected" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                          {st === "approved" ? <Check className="h-3.5 w-3.5" /> : st === "rejected" ? <X className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />} {S[st]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
