// components/admin/AdminStories.tsx — 🛡️ Admin: 💍 ආදර කතා
//   • Requests  — users එවපු කතා (සහකරු තහවුරු කළාද · 🎁 තෑග්ග) → Publish / Reject
//   • Published — home slider එකේ පෙන්නනවද (on/off) · text වෙනස් කරන්න · 🎁 තෑග්ග යැව්වා
//   • ➕ Add slide — admin slider එකට image + text එක්ක අලුත් slide එකක්
"use client";

import { useEffect, useState } from "react";
import { Check, EyeOff, Gift, Heart, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import CanvasImage from "@/components/CanvasImage";

type Story = {
  id: string; names: string; place: string | null; married_year: number | null; story: string; photo_url: string | null; created_at: string;
  partner_confirmed_at?: string | null; show_in_slider?: boolean; is_custom?: boolean; gift_sent_at?: string | null;
  profile: { full_name: string; email: string } | null;
};

export default function AdminStories() {
  const { showAlert, showConfirm } = useDialog();
  const [tab, setTab] = useState<"pending" | "approved" | "add">("pending");
  const [list, setList] = useState<Story[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Story | null>(null);
  const [slide, setSlide] = useState({ names: "", place: "", married_year: String(new Date().getFullYear()), story: "" });
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);

  const load = (s = tab) => { if (s === "add") return; fetch(`/api/admin/stories?status=${s}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setList(d.stories ?? [])).catch(() => setList([])); };
  useEffect(() => { load(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const post = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    const res = await fetch("/api/admin/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => null); showAlert({ title: "Something went wrong", message: d?.error, tone: "error" }); return false; }
    return true;
  };
  const act = async (s: Story, action: "approve" | "reject" | "unpublish" | "gift" | "delete") => {
    if ((action === "reject" || action === "unpublish" || action === "delete") && !(await showConfirm({ title: `${action[0].toUpperCase()}${action.slice(1)} "${s.names}"?`, tone: "danger", confirmText: "Yes" }))) return;
    if (await post({ id: s.id, action }, s.id + action)) load(tab);
  };
  // ↑ ↓ slider පිළිවෙළ — ලැයිස්තුවේ පිළිවෙළට sort_order නැවත දානවා
  const move = async (idx: number, dir: -1 | 1) => {
    const arr = [...(list ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setList(arr);
    setBusy("order");
    await Promise.all(arr.map((x, k) => fetch("/api/admin/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: x.id, action: "update", sort_order: k + 1 }) })));
    setBusy(null);
  };
  const toggleSlider = async (s: Story) => {
    setList((l) => (l ?? []).map((x) => (x.id === s.id ? { ...x, show_in_slider: !s.show_in_slider } : x)));
    if (!(await post({ id: s.id, action: "update", show_in_slider: !s.show_in_slider }, s.id + "sl"))) load(tab);
  };
  const saveEdit = async () => {
    if (!editing) return;
    if (await post({ id: editing.id, action: "update", names: editing.names, place: editing.place ?? "", married_year: editing.married_year, story: editing.story }, "edit")) { setEditing(null); load(tab); }
  };
  const addSlide = async () => {
    setBusy("add");
    const fd = new FormData();
    Object.entries(slide).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append("photo", photo.file);
    const res = await fetch("/api/admin/stories", { method: "POST", body: fd });
    setBusy(null);
    if (!res.ok) { const d = await res.json().catch(() => null); return showAlert({ title: "Couldn't add slide", message: d?.error, tone: "error" }); }
    setSlide({ names: "", place: "", married_year: String(new Date().getFullYear()), story: "" });
    setPhoto(null);
    showAlert({ title: "Slide added — it's live on the home slider", tone: "success" });
    setTab("approved");
  };

  const input = "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <section className="rounded-[2rem] border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Heart className="h-6 w-6 text-primary" /> Success stories & home slider</h2>
        <div className="flex rounded-xl border border-border p-1">
          {([["pending", "Requests"], ["approved", "Published / slider"], ["add", "+ Add slide"]] as const).map(([s, label]) => (
            <button key={s} onClick={() => { setList(null); setTab(s); }} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === s ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {tab === "pending" ? "Stories sent by couples (one partner is enough). Once published, contact them and send the 🎁 gift." : tab === "approved" ? "Everything on the home slider — turn slides on/off, reorder, edit text, and mark gifts as sent." : "Add your own slide (photo + text) to the home slider."}
      </p>

      {tab === "add" ? (
        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_1.3fr]">
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setPhoto({ file: f, url: URL.createObjectURL(f) }); }} className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/50">
            {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo.url} alt="" className="h-full w-full object-cover" /> : <><ImagePlus className="h-8 w-8" /><span className="text-sm font-semibold">Photo</span></>}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto({ file: f, url: URL.createObjectURL(f) }); }} />
          </label>
          <div className="space-y-3">
            <input value={slide.names} onChange={(e) => setSlide({ ...slide, names: e.target.value })} placeholder="Names (e.g. Kasun ❤ Dilini)" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <input value={slide.place} onChange={(e) => setSlide({ ...slide, place: e.target.value })} placeholder="Place" className={input} />
              <input type="number" value={slide.married_year} onChange={(e) => setSlide({ ...slide, married_year: e.target.value })} placeholder="Year" className={input} />
            </div>
            <textarea rows={5} value={slide.story} onChange={(e) => setSlide({ ...slide, story: e.target.value })} placeholder="Quote / story" className={`${input} resize-y`} />
            <button onClick={addSlide} disabled={busy === "add" || slide.names.trim().length < 3 || slide.story.trim().length < 10} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to slider</button>
          </div>
        </div>
      ) : list === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" /> : list.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">Nothing here yet</p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {list.map((s, idx) => {
            const edit = editing?.id === s.id;
            return (
              <article key={s.id} className="overflow-hidden rounded-2xl border border-border">
                <div className="relative">
                  {s.photo_url ? <CanvasImage src={s.photo_url} alt={s.names} className="block aspect-[16/9] w-full" /> : <div className="flex aspect-[16/9] items-center justify-center bg-muted text-sm text-muted-foreground">No photo</div>}
                  {s.is_custom && <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold">Admin slide</span>}
                  {tab === "approved" && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{idx + 1}</span>}
                </div>
                <div className="space-y-3 p-4">
                  {edit ? (
                    <>
                      <input value={editing.names} onChange={(e) => setEditing({ ...editing, names: e.target.value })} className={input} />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editing.place ?? ""} onChange={(e) => setEditing({ ...editing, place: e.target.value })} placeholder="Place" className={input} />
                        <input type="number" value={editing.married_year ?? ""} onChange={(e) => setEditing({ ...editing, married_year: Number(e.target.value) || null })} placeholder="Year" className={input} />
                      </div>
                      <textarea rows={4} value={editing.story} onChange={(e) => setEditing({ ...editing, story: e.target.value })} className={`${input} resize-y`} />
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(null)} className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold">Cancel</button>
                        <button onClick={saveEdit} disabled={busy === "edit"} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-bold">{s.names} <span className="text-sm font-normal text-muted-foreground">{[s.place, s.married_year].filter(Boolean).join(" · ")}</span></p>
                      <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{s.story}</p>
                      {!s.is_custom && <p className="text-xs text-muted-foreground">From {s.profile?.full_name ?? "—"} · {s.profile?.email} · {new Date(s.created_at).toLocaleDateString()}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {!s.is_custom && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.gift_sent_at ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-primary/10 text-primary"}`}>{s.gift_sent_at ? `🎁 Gift sent ${new Date(s.gift_sent_at).toLocaleDateString()}` : "🎁 Gift not sent yet"}</span>}
                      </div>
                    </>
                  )}

                  {!edit && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {tab === "pending" ? (
                        <>
                          <button disabled={busy === s.id + "approve"} onClick={() => act(s, "approve")} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-sm font-semibold text-white disabled:opacity-40"><Check className="h-4 w-4" /> Publish</button>
                          <button onClick={() => act(s, "reject")} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:text-red-500"><X className="h-4 w-4" /> Reject</button>
                        </>
                      ) : (
                        <>
                          {/* 👇 Home slider එකේ පෙන්නනවද */}
                          <button type="button" role="switch" aria-checked={!!s.show_in_slider} onClick={() => toggleSlider(s)} className="flex items-center gap-2 text-sm font-semibold">
                            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${s.show_in_slider ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${s.show_in_slider ? "translate-x-6" : "translate-x-1"}`} /></span>
                            On slider
                          </button>
                          <span className="flex-1" />
                          <button disabled={busy === "order" || idx === 0} onClick={() => move(idx, -1)} title="Move up" className="rounded-lg border border-border px-2 py-1.5 text-xs font-bold disabled:opacity-30">↑</button>
                          <button disabled={busy === "order" || idx === list.length - 1} onClick={() => move(idx, 1)} title="Move down" className="rounded-lg border border-border px-2 py-1.5 text-xs font-bold disabled:opacity-30">↓</button>
                          <button onClick={() => setEditing(s)} title="Edit text" className="rounded-lg border border-border p-2 hover:border-primary hover:text-primary"><Pencil className="h-4 w-4" /></button>
                          {!s.is_custom && !s.gift_sent_at && <button onClick={() => act(s, "gift")} title="Mark gift as sent" className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"><Gift className="h-4 w-4" /> Gift sent</button>}
                          <button onClick={() => act(s, "delete")} title="Delete permanently" className="rounded-lg border border-border p-2 hover:border-red-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                          {!s.is_custom && <button onClick={() => act(s, "unpublish")} title="Unpublish" className="rounded-lg border border-border p-2 hover:border-red-500 hover:text-red-500"><EyeOff className="h-4 w-4" /></button>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
