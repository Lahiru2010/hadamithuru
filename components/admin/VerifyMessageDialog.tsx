// components/admin/VerifyMessageDialog.tsx — 🛡️ Admin: තහවුරු කිරීමේ ගැටලුවක් ගැන user ට දැනුම් දෙන dialog එක
// • "Keep pending"  → ඉල්ලීම එහෙමම තියනවා, user ට පොඩි දෙයක් හදන්න කියනවා (උදා: phone අංකය)
// • "Reject"        → ඉල්ලීම ප්‍රතික්ෂේප, user ට නැවත upload කරන්න ඕනේ (උදා: ID එක පැහැදිලි නෑ)
// පණිවිඩය 🔔 notification එකක් විදිහටත්, 🎧 support chat එකටත් යනවා (user ට එතනින්ම reply කරන්න පුළුවන්).
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Loader2, MessageSquareWarning, RotateCcw, Send, X } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { VERIFY_ISSUE_LABELS, buildVerifyMessage, verifyChatPrefix, type VerifyIssueKey } from "@/lib/verify-issues";

export type VerifyMessageTarget = {
  userId: string;
  requestId?: string;
  name: string;
  checklist?: { email: boolean; phone: boolean; photo: boolean };
  defaultMode?: "info" | "reject";
};

const LANGS: [Language, string][] = [["si", "සිංහල"], ["en", "English"], ["ta", "தமிழ்"]];

export default function VerifyMessageDialog({ target, onClose, onSent }: { target: VerifyMessageTarget; onClose: () => void; onSent: () => void }) {
  const canReject = !!target.requestId; // ID request එකක් නැත්නම් reject කරන්න දෙයක් නෑ
  const [mode, setMode] = useState<"info" | "reject">(canReject ? target.defaultMode ?? "info" : "info");
  const [lang, setLang] = useState<Language>("si");
  // 👇 Checklist එකේ නැති දේවල් මුලින්ම tick කරලා
  const [issues, setIssues] = useState<VerifyIssueKey[]>(() => {
    const c = target.checklist;
    const pre: VerifyIssueKey[] = [];
    if (c && !c.phone) pre.push("phone_missing");
    if (c && !c.email) pre.push("email_unconfirmed");
    if (c && !c.photo) pre.push("photo_missing");
    if (!pre.length && target.defaultMode === "reject") pre.push("id_unclear");
    return pre;
  });
  const [edited, setEdited] = useState<string | null>(null); // admin අතින් වෙනස් කළොත් template එක override වෙනවා
  const [sendChat, setSendChat] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = buildVerifyMessage(lang, issues, mode);
  const text = edited ?? template;

  const toggleIssue = (k: VerifyIssueKey) => setIssues((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));

  const send = async () => {
    if (!text.trim()) return setError("Write a message first.");
    setSending(true);
    setError(null);
    const res = await fetch("/api/admin/verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: target.userId,
        requestId: target.requestId,
        action: mode === "reject" ? "reject" : "inform",
        note: text.trim(),
        chatNote: sendChat ? `${verifyChatPrefix(lang)}\n${text.trim()}` : null,
      }),
    });
    setSending(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      return setError(d?.error ?? "Something went wrong");
    }
    onSent();
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-modal-content">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold"><MessageSquareWarning className="h-5 w-5 text-amber-500" /> Message {target.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Tell the user what needs fixing. Goes to their 🔔 notifications and /verify page.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5 custom-scrollbar">
          {/* 👇 Pending තියනවද / Reject කරනවද */}
          {canReject && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setMode("info")} className={`rounded-2xl border p-3 text-left transition ${mode === "info" ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-amber-500/40"}`}>
                <p className="text-sm font-bold">Keep pending</p>
                <p className="text-xs text-muted-foreground">Small fix (e.g. add phone). Request stays in the queue.</p>
              </button>
              <button type="button" onClick={() => setMode("reject")} className={`rounded-2xl border p-3 text-left transition ${mode === "reject" ? "border-red-500 bg-red-500/10" : "border-border hover:border-red-500/40"}`}>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">Reject</p>
                <p className="text-xs text-muted-foreground">User must upload the ID again.</p>
              </button>
            </div>
          )}

          {/* 👇 User ගේ භාෂාව */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Message language</p>
            <div className="inline-flex rounded-xl border border-border p-1">
              {LANGS.map(([l, label]) => (
                <button key={l} type="button" onClick={() => setLang(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${lang === l ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>

          {/* 👇 ගැටලු (කීපයක් තෝරන්න පුළුවන්) */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Issues</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(VERIFY_ISSUE_LABELS) as VerifyIssueKey[]).map((k) => {
                const on = issues.includes(k);
                return (
                  <button key={k} type="button" onClick={() => toggleIssue(k)} aria-pressed={on} className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}>
                    {on && <Check className="h-3.5 w-3.5" />} {VERIFY_ISSUE_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 👇 යවන පණිවිඩය — ඕන නම් වෙනස් කරන්න */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Message to user</p>
              {edited !== null && (
                <button type="button" onClick={() => setEdited(null)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><RotateCcw className="h-3.5 w-3.5" /> Reset to template</button>
              )}
            </div>
            <textarea value={text} onChange={(e) => setEdited(e.target.value)} rows={7} maxLength={1500} className="w-full resize-y rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary" />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={sendChat} onChange={(e) => setSendChat(e.target.checked)} className="h-4 w-4 accent-[#D52047]" />
            Also send in the user&apos;s 🎧 support chat (they can reply)
          </label>

          {error && <p className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" /> {error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
          <button type="button" onClick={send} disabled={sending || !text.trim()} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${mode === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}`}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "reject" ? <X className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {mode === "reject" ? "Reject & send" : "Send message"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
