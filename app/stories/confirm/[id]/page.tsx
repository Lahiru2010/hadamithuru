// app/stories/confirm/[id]/page.tsx — 💍 සහකරු ආදර කතාව තහවුරු කරනවා (දෙදෙනාම එකඟ වුණාම විතරයි admin පළ කරන්නේ)
"use client";

import { use, useEffect, useState } from "react";
import { Check, HeartHandshake, Loader2, X } from "lucide-react";
import { useLang } from "@/components/providers";

type Story = { names: string; place: string | null; married_year: number | null; story: string; photo_url: string | null; from_name: string; partner_confirmed_at: string | null; status: string };

export default function ConfirmStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLang();
  const S = t.stories;
  const [story, setStory] = useState<Story | null | "missing">(null);
  const [done, setDone] = useState<"yes" | "no" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/${id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setStory(d?.isPartner ? d.story : "missing")).catch(() => setStory("missing"));
  }, [id]);

  const answer = async (confirm: boolean) => {
    setBusy(true);
    const res = await fetch(`/api/stories/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    setBusy(false);
    if (res.ok) setDone(confirm ? "yes" : "no");
  };

  if (story === null) return <main className="flex min-h-[60vh] items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></main>;
  if (story === "missing") return <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 text-center text-muted-foreground">{t.notFound.title}</main>;
  const already = !!story.partner_confirmed_at || done === "yes";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/25"><HeartHandshake className="h-7 w-7" /></span>
          <h1 className="mt-4 text-3xl font-extrabold">{S.confirmTitle}</h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{S.confirmText.replace("{name}", story.from_name)}</p>
        </div>
        <article className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          {story.photo_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={story.photo_url} alt="" className="aspect-[16/9] w-full object-cover" />}
          <div className="p-6">
            <p className="text-lg font-bold">{story.names} <span className="text-sm font-normal text-muted-foreground">{[story.place, story.married_year].filter(Boolean).join(" · ")}</span></p>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{story.story}</p>
          </div>
        </article>
        <div className="mt-6">
          {already ? (
            <p className="flex items-center justify-center gap-2 rounded-2xl bg-green-500/10 p-4 font-semibold text-green-700 dark:text-green-400"><Check className="h-5 w-5" /> {S.confirmed}</p>
          ) : done === "no" || story.status === "rejected" ? (
            <p className="rounded-2xl bg-muted p-4 text-center font-semibold text-muted-foreground">{S.declined}</p>
          ) : (
            <div className="flex gap-3">
              <button disabled={busy} onClick={() => answer(false)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border py-4 font-semibold text-muted-foreground hover:border-red-500/40 hover:text-red-500"><X className="h-5 w-5" /> {S.confirmNo}</button>
              <button disabled={busy} onClick={() => answer(true)} className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] py-4 font-bold text-white shadow-lg shadow-primary/25">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} {S.confirmYes}</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
