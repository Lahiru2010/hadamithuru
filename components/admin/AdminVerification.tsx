// components/admin/AdminVerification.tsx — 🛡️ Admin: අලුත් users + හැඳුනුම්පත් තහවුරු කිරීම්
"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Check, Clock, ExternalLink, Eye, Loader2, MessageSquareWarning, X } from "lucide-react";
import VerifyMessageDialog, { type VerifyMessageTarget } from "@/components/admin/VerifyMessageDialog";
import { useDialog } from "@/components/DialogProvider";
import CanvasImage from "@/components/CanvasImage";
import { ProfileModal } from "@/components/ProfileModal";
import { createClient } from "@/lib/client";

type Req = {
  id: string; user_id: string; doc_type: string; created_at: string;
  front_url: string | null; back_url: string | null; selfie_url: string | null;
  admin_note?: string | null; // 👈 User ට කලින් යවපු පණිවිඩය (pending අතරේ)
  profile: { full_name: string; email: string; age?: number; gender?: string; city?: string; country?: string } | null;
  checklist?: { email: boolean; phone: boolean; photo: boolean };
};
type NewUser = { id: string; full_name: string | null; email: string | null; age?: number; gender?: string; city?: string; district?: string; country?: string; created_at: string; is_published: boolean; id_verified: string | null; has_pending_request: boolean };

const DOC = { nic: "NIC", passport: "Passport", license: "Driving licence" } as Record<string, string>;
const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

export default function AdminVerification() {
  const { showConfirm, showAlert } = useDialog();
  const [tab, setTab] = useState<"requests" | "new">("requests");
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [users, setUsers] = useState<NewUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);
  const [messaging, setMessaging] = useState<VerifyMessageTarget | null>(null); // 👈 ගැටලුවක් ගැන user ට පණිවිඩයක්
  // 👇 New users: සෙවීම / පිළිවෙළ / පිටු
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name" | "verified" | "unverified">("newest");
  const [page, setPage] = useState(1);
  const PER = 10;

  // 👇 User ගේ සම්පූර්ණ විස්තර popup එකකින් (verify කරන්න කලින් බලන්න)
  const viewProfile = async (userId: string) => {
    const { data } = await createClient().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) setViewing({ ...data, avatar_url: `/api/avatar/${userId}?admin=1`, isBlurred: false, interestStatus: "accepted" });
  };

  const loadReqs = () => fetch("/api/admin/verifications?status=pending", { cache: "no-store" }).then((r) => r.json()).then((d) => setReqs(d.requests ?? []));
  const loadUsers = () => fetch("/api/admin/users?days=30", { cache: "no-store" }).then((r) => r.json()).then((d) => setUsers(d.users ?? []));
  useEffect(() => {
    loadReqs(); loadUsers();
    // ⚡ Realtime: අලුත් request එකක් ආපු ගමන් refresh
    const onChange = () => { loadReqs(); loadUsers(); };
    window.addEventListener("admin-data-changed", onChange);
    return () => window.removeEventListener("admin-data-changed", onChange);
  }, []);

  // 👇 Approve / Unverify (Reject එක දැන් VerifyMessageDialog එකෙන් — හේතුවත් එක්ක user ට යනවා)
  const act = async (userId: string, action: "approve" | "unverify", requestId?: string) => {
    const ok = await showConfirm({ title: action === "approve" ? "Mark this user as verified?" : "Remove verified badge?", confirmText: action === "approve" ? "Verify" : "Remove", tone: action === "approve" ? "default" : "danger" });
    if (!ok) return;
    setBusy(userId + action);
    const res = await fetch("/api/admin/verifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, requestId, action }) });
    setBusy(null);
    if (!res.ok) return showAlert({ title: "Something went wrong", tone: "error" });
    loadReqs(); loadUsers();
  };

  return (
    <section className="mb-10 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><BadgeCheck className="h-6 w-6 text-blue-500" /> Verification</h2>
        <div className="flex rounded-xl border border-border p-1">
          <button onClick={() => setTab("requests")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === "requests" ? "bg-primary text-white" : "text-muted-foreground"}`}>ID requests {reqs && reqs.length > 0 && <span className="ml-1 rounded-full bg-white/25 px-1.5">{reqs.length}</span>}</button>
          <button onClick={() => setTab("new")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === "new" ? "bg-primary text-white" : "text-muted-foreground"}`}>New users (30 days)</button>
        </div>
      </div>

      {tab === "requests" ? (
        reqs === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" /> :
        reqs.length === 0 ? <p className="mt-6 text-center text-muted-foreground">No pending requests 🎉</p> : (
          <div className="mt-6 space-y-5">
            {reqs.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{r.profile?.full_name ?? "Unknown"} <span className="text-sm font-normal text-muted-foreground">· {r.profile?.email}</span></p>
                    <p className="text-sm text-muted-foreground">{DOC[r.doc_type]} · {[r.profile?.age && `${r.profile.age} yrs`, r.profile?.gender, r.profile?.city, r.profile?.country].filter(Boolean).join(" · ")} · <Clock className="inline h-3.5 w-3.5" /> {ago(r.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewProfile(r.user_id)} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"><Eye className="h-4 w-4" /> Profile</button>
                    {/* 👇 ගැටලුවක් තියෙනවා නම් — pending තියාගෙන user ට කියන්න */}
                    <button disabled={!!busy} onClick={() => setMessaging({ userId: r.user_id, requestId: r.id, name: r.profile?.full_name ?? "user", checklist: r.checklist, defaultMode: "info" })} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-amber-500/50 hover:text-amber-600"><MessageSquareWarning className="h-4 w-4" /> Message</button>
                    <button disabled={!!busy} onClick={() => setMessaging({ userId: r.user_id, requestId: r.id, name: r.profile?.full_name ?? "user", checklist: r.checklist, defaultMode: "reject" })} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-red-500/40 hover:text-red-500"><X className="h-4 w-4" /> Reject</button>
                    <button disabled={!!busy} onClick={() => act(r.user_id, "approve", r.id)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{busy === r.user_id + "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve</button>
                  </div>
                </div>
                {/* 👇 Verification checklist එක */}
                {r.checklist && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {([["Email confirmed", r.checklist.email], ["Mobile number added", r.checklist.phone], ["Profile photo added", r.checklist.photo]] as const).map(([label, ok]) => (
                      <span key={label} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                        {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} {label}
                      </span>
                    ))}
                  </div>
                )}
                {/* 👇 දැනටමත් user ට යවපු පණිවිඩය (user තවම හදලා නැත්නම්) */}
                {r.admin_note && (
                  <p className="mt-3 whitespace-pre-line rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <span className="font-bold">Message sent to user:</span> {r.admin_note}
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[["Front", r.front_url], ["Back", r.back_url], ["Selfie", r.selfie_url]].filter(([, u]) => u).map(([label, u]) => (
                    <a key={label} href={u!} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-border">
                      <CanvasImage src={u!} alt={label!} className="block aspect-[4/3] w-full" />
                      <span className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold">{label} <ExternalLink className="h-3.5 w-3.5 opacity-60" /></span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        users === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" /> : (() => {
          const term = q.trim().toLowerCase();
          const filtered = users
            .filter((u) => !term || (u.full_name ?? "").toLowerCase().includes(term) || (u.email ?? "").toLowerCase().includes(term))
            .sort((a, b) => {
              const va = a.id_verified === "Yes" ? 1 : 0, vb = b.id_verified === "Yes" ? 1 : 0;
              if (sort === "verified") return vb - va || b.created_at.localeCompare(a.created_at);
              if (sort === "unverified") return va - vb || b.created_at.localeCompare(a.created_at);
              if (sort === "name") return (a.full_name ?? "").localeCompare(b.full_name ?? "");
              return sort === "oldest" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at);
            });
          const pages = Math.max(1, Math.ceil(filtered.length / PER));
          const cur = Math.min(page, pages);
          const shown = filtered.slice((cur - 1) * PER, cur * PER);
          return (
          <>
          <div className="mt-5 flex flex-wrap gap-3">
            {/* 👇 සෙවීම + ✕ එකෙන් එකපාරම clear කරන්න */}
            <div className="relative min-w-[14rem] flex-1">
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name or email…" className="w-full rounded-xl border border-border bg-muted/30 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-primary" />
              {q && (
                <button type="button" onClick={() => { setQ(""); setPage(1); }} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="verified">Verified first</option>
              <option value="unverified">Not verified first</option>
            </select>
            <span className="self-center text-sm text-muted-foreground">{filtered.length} users</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Details</th><th className="py-2 pr-3">Joined</th><th className="py-2 pr-3">Status</th><th className="py-2 text-right">Verify</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((u) => {
                  const verified = u.id_verified === "Yes";
                  return (
                    <tr key={u.id}>
                      <td className="py-3 pr-3"><button onClick={() => viewProfile(u.id)} className="text-left"><p className="font-semibold hover:text-primary">{u.full_name || "—"}</p><p className="text-xs text-muted-foreground">{u.email}</p></button></td>
                      <td className="py-3 pr-3 text-muted-foreground">{[u.age && `${u.age}`, u.gender, u.city || u.district, u.country].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{ago(u.created_at)}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.is_published ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>{u.is_published ? "Published" : "Draft"}</span>
                        {u.has_pending_request && <span className="ml-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">ID sent</span>}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button disabled={!!busy} onClick={() => setMessaging({ userId: u.id, name: u.full_name || u.email || "user" })} title="Message user" aria-label="Message user" className="mr-1.5 inline-flex items-center rounded-lg border border-border p-1.5 text-muted-foreground hover:border-amber-500/50 hover:text-amber-600"><MessageSquareWarning className="h-4 w-4" /></button>
                        {verified ? (
                          <button disabled={!!busy} onClick={() => act(u.id, "unverify")} className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-red-500/10 hover:text-red-500"><BadgeCheck className="h-4 w-4" /> Verified</button>
                        ) : (
                          <button disabled={!!busy} onClick={() => act(u.id, "approve")} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:border-blue-500 hover:text-blue-600"><Check className="h-4 w-4" /> Verify</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Prev</button>
              <span className="text-sm text-muted-foreground">Page {cur} / {pages}</span>
              <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Next</button>
            </div>
          )}
          </>
          );
        })()
      )}
      {viewing && <ProfileModal profile={viewing} onClose={() => setViewing(null)} hideActions isPreview adminView />}
      {messaging && (
        <VerifyMessageDialog
          target={messaging}
          onClose={() => setMessaging(null)}
          onSent={() => {
            setMessaging(null);
            showAlert({ title: "Message sent to the user", tone: "success" });
            loadReqs(); loadUsers();
          }}
        />
      )}
    </section>
  );
}
