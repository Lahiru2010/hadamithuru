// components/NotificationsBell.tsx
// 🔔 Navbar එකේ දැනුම්දීම්:
//  - User: "ඔබ තහවුරුයි!" / "තහවුරු කිරීම අනුමත වුණේ නෑ" (admin verify කළාම), සහ verify කරලා නැත්නම් මතක් කිරීමක්
//    එකින් එක කියෙව්වා / නොකියෙව්වා කරන්න, මකන්න, සියල්ල මකන්න පුළුවන්
//  - Admin: අලුත් verification requests / support messages ගණන
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, BadgeCheck, AlertCircle, ShieldCheck, Headset, X, Mail, MailOpen, Trash2, Crown, Gift, Heart, Zap } from "lucide-react";
import { FOUNDING_MONTHS } from "@/lib/offer";
import { useDialog } from "@/components/DialogProvider";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { timeAgo } from "@/lib/last-seen";
import { playChime, openAdminTab } from "@/lib/chime";

type Notif = { id: string; type: string; body: string | null; link: string | null; read_at: string | null; created_at: string };
const REMINDER_SEEN_KEY = "seneha_verify_reminder_seen"; // 👈 එක පාරක් බැලුවම රතු තිත අයින් වෙනවා (list එකේ තියෙනවා)
const REMINDER_SNOOZE_KEY = "seneha_verify_reminder_snooze"; // 👈 "දින 7කට සඟවන්න" — { userId, until }
const VERIFY_MSG_TYPES = ["verify_rejected", "verify_info"]; // 👈 user verify වුණාම මේවා අයින් වෙනවා

export default function NotificationsBell({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const { t, lang } = useLang();
  const E = t.extra;
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderSeen, setReminderSeen] = useState(true);
  const [admin, setAdmin] = useState({ pendingVerifications: 0, unreadSupport: 0, openReports: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const { showConfirm } = useDialog();

  useEffect(() => {
    Promise.all([
      supabase.from("notifications").select("id, type, body, link, read_at, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      supabase.from("profiles").select("id_verified").eq("id", userId).maybeSingle(),
    ]).then(([{ data }, { data: prof }]) => {
      const verified = prof?.id_verified === "Yes";
      let list = (data as Notif[]) ?? [];
      // 👇 දැනටමත් verify වෙලා නම් "මේක හදන්න" / "අනුමත වුණේ නෑ" පණිවිඩ පරණයි — පෙන්නන්නේ නෑ, DB එකෙනුත් අයින් කරනවා
      if (verified && list.some((n) => VERIFY_MSG_TYPES.includes(n.type))) {
        list = list.filter((n) => !VERIFY_MSG_TYPES.includes(n.type));
        supabase.from("notifications").delete().eq("user_id", userId).in("type", VERIFY_MSG_TYPES).then(() => {});
      }
      setItems(list);
      // 👇 Verify කරලා නැති හැමෝටම "තහවුරු වන්න" මතක් කිරීම — verify වුණාම අයින් වෙනවා (ඕන නම් දින 7කට සඟවන්න පුළුවන්)
      let snoozed = false;
      try {
        const sn = JSON.parse(localStorage.getItem(REMINDER_SNOOZE_KEY) ?? "null");
        snoozed = sn?.userId === userId && Date.now() < Number(sn?.until);
      } catch { /* පරණ / වැරදි අගයක් නම් නොසලකා හරිනවා */ }
      setShowReminder(!isAdmin && !verified && !snoozed);
      setReminderSeen(localStorage.getItem(REMINDER_SEEN_KEY) === userId);
    });
    const ch = supabase
      .channel(`notif_${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (p) => {
        const n = p.new as Notif;
        // 👇 Verify වුණ ගමන් මතක් කිරීමයි, "මේක හදන්න" පණිවිඩයි ඔක්කොම අයින්
        if (n.type === "verified") {
          setShowReminder(false);
          setItems((prev) => [n, ...prev.filter((x) => !VERIFY_MSG_TYPES.includes(x.type))]);
        } else {
          setItems((prev) => [n, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, isAdmin, supabase]);

  // Admin: අලුත් දේවල් ගණන + ⚡ REALTIME — verification / support / report ආපු ගමන් (browser එක open නම්)
  const [toasts, setToasts] = useState<{ id: string; tab: "verify" | "support" | "reports" | "pricing"; text: string }[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => fetch("/api/admin/summary", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setAdmin(d));
    load();
    const id = setInterval(load, 60000);
    const push = (tab: "verify" | "support" | "reports" | "pricing", text: string) => {
      const tid = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id: tid, tab, text }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 9000);
      playChime();
      load();
      window.dispatchEvent(new Event("admin-data-changed")); // Admin dashboard එකේ lists refresh වෙන්න
    };
    const ch = supabase
      .channel("admin_live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "verification_requests" }, () => push("verify", "New verification request"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: "sender=eq.user" }, () => push("support", "New customer support message"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, () => push("reports", "New user report"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "boost_requests" }, () => push("pricing", "⚡ New boost request"))
      .subscribe();
    return () => { clearInterval(id); supabase.removeChannel(ch); };
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false); };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("scroll", close); window.removeEventListener("resize", close); };
  }, [open]);

  const unread = items.filter((n) => !n.read_at).length + (showReminder && !reminderSeen ? 1 : 0) + (isAdmin ? (admin.pendingVerifications > 0 ? 1 : 0) + (admin.unreadSupport > 0 ? 1 : 0) + (admin.openReports > 0 ? 1 : 0) : 0);

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  };

  // 👇 එකක් කියෙව්වා / නොකියෙව්වා ලෙස මාරු කරනවා
  const setRead = async (n: Notif, read: boolean) => {
    const read_at = read ? new Date().toISOString() : null;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at } : x)));
    const { error } = await supabase.from("notifications").update({ read_at }).eq("id", n.id).eq("user_id", userId);
    if (error) setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: n.read_at } : x)));
  };

  // 👇 එකක් මකනවා
  const removeOne = async (n: Notif) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    const { error } = await supabase.from("notifications").delete().eq("id", n.id).eq("user_id", userId);
    if (error) setItems((prev) => [...prev, n].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };

  // 👇 සියල්ල මකනවා (confirm කරලා)
  const clearAll = async () => {
    setOpen(false);
    const ok = await showConfirm({ title: E.notifClearTitle, message: E.notifClearMsg, confirmText: E.notifClearAll, tone: "danger" });
    if (!ok) return;
    const before = items;
    setItems([]);
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
    if (error) setItems(before);
  };

  // 👇 "තහවුරු වන්න" මතක් කිරීම දින 7කට සඟවනවා
  const snoozeReminder = () => {
    localStorage.setItem(REMINDER_SNOOZE_KEY, JSON.stringify({ userId, until: Date.now() + 7 * 86400_000 }));
    setShowReminder(false);
  };

  // Bell එක open කළාම මතක් කිරීම "බැලුවා" ලෙස සලකනවා (රතු තිත අයින්, list එකේ තියෙනවා)
  useEffect(() => {
    if (open && showReminder && !reminderSeen) {
      localStorage.setItem(REMINDER_SEEN_KEY, userId);
      setReminderSeen(true);
    }
  }, [open, showReminder, reminderSeen, userId]);

  const text = (n: Notif) =>
    n.type === "verified" ? E.notifVerified
    : n.type === "verify_rejected" ? E.notifVerifyRejected
    : n.type === "verify_info" ? E.notifVerifyInfo
    : n.type === "founding_member" ? t.offer.notifFounding.replace("{n}", n.body ?? "").replace("{months}", String(FOUNDING_MONTHS))
    : n.type === "verify_reward" ? t.offer.notifVerifyReward.replace("{n}", n.body ?? "1")
    : n.type === "referral_reward" ? t.invite.notifReward.replace("{n}", n.body ?? "1")
    : n.type === "story_approved" ? t.stories.notifApproved
    : n.type === "story_confirm" ? t.stories.notifConfirm.replace("{names}", n.body ?? "")
    : n.type === "boost_active" ? t.boost.notifActive.replace("{date}", n.body ? new Date(n.body).toLocaleDateString() : "")
    : n.type === "report_reviewed" ? E.reportReviewed.replace("{name}", n.body ?? "")
    : n.body ?? "";

  return (
    <div ref={ref} className="relative">
      {/* ⚡ Admin realtime toasts (දකුණු පැත්තේ උඩ) — click කළාම ඒ tab එක */}
      {isAdmin && toasts.length > 0 && createPortal(
        <div className="fixed right-4 top-20 z-[230] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
          {toasts.map((tst) => (
            <Link
              key={tst.id}
              href={`/admin?tab=${tst.tab}`}
              onClick={() => { openAdminTab(tst.tab); setToasts((t) => t.filter((x) => x.id !== tst.id)); }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300 hover:border-primary/40"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              {tst.tab === "verify" ? <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" /> : tst.tab === "support" ? <Headset className="h-5 w-5 shrink-0 text-primary" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />}
              <span className="text-sm font-semibold">{tst.text}</span>
            </Link>
          ))}
        </div>,
        document.body
      )}
      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 8, right: Math.max(8, document.documentElement.clientWidth - r.right) });
          setOpen((o) => !o);
        }}
        aria-label={E.notifications}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border transition hover:bg-muted"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>

      {open && pos && createPortal(
        <div ref={panelRef} style={{ position: "fixed", top: pos.top, right: pos.right }} className="z-[200] w-96 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="font-bold">{E.notifications}</p>
            <div className="flex items-center gap-3">
              {items.some((n) => !n.read_at) && <button onClick={markAllRead} className="text-xs font-semibold text-primary hover:underline">{E.markAllRead}</button>}
              {items.length > 0 && <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-red-500 hover:underline">{E.notifClearAll}</button>}
            </div>
          </div>
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto custom-scrollbar">
            {isAdmin && admin.pendingVerifications > 0 && (
              <li><Link href="/admin?tab=verify" onClick={() => { setOpen(false); openAdminTab("verify"); }} className="flex gap-3 p-4 hover:bg-muted/50"><BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" /><span className="text-sm font-semibold">{E.notifAdminVerify.replace("{n}", String(admin.pendingVerifications))}</span></Link></li>
            )}
            {isAdmin && admin.unreadSupport > 0 && (
              <li><Link href="/admin?tab=support" onClick={() => { setOpen(false); openAdminTab("support"); }} className="flex gap-3 p-4 hover:bg-muted/50"><Headset className="h-5 w-5 shrink-0 text-primary" /><span className="text-sm font-semibold">{E.notifAdminSupport.replace("{n}", String(admin.unreadSupport))}</span></Link></li>
            )}
            {isAdmin && admin.openReports > 0 && (
              <li><Link href="/admin?tab=reports" onClick={() => { setOpen(false); openAdminTab("reports"); }} className="flex gap-3 p-4 hover:bg-muted/50"><AlertCircle className="h-5 w-5 shrink-0 text-red-500" /><span className="text-sm font-semibold">{admin.openReports} new report(s)</span></Link></li>
            )}
            {showReminder && (
              <li className="flex gap-3 bg-blue-500/5 p-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{E.notifGetVerified}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Link href="/verify" onClick={() => setOpen(false)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">{E.getVerified}</Link>
                    <button type="button" onClick={snoozeReminder} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">{E.notifSnooze}</button>
                  </div>
                </div>
              </li>
            )}
            {items.map((n) => (
              <li key={n.id} className={`group relative flex items-start ${n.read_at ? "" : "bg-primary/5"}`}>
                {/* 👇 Click කළාම ඒ page එකට + කියෙව්වා ලෙස */}
                <Link href={n.link ?? "#"} onClick={() => { setOpen(false); if (!n.read_at) setRead(n, true); }} className="flex min-w-0 flex-1 gap-3 p-4 pr-2 hover:bg-muted/50">
                  {n.type === "verified" ? <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" />
                    : n.type === "founding_member" ? <Crown className="h-5 w-5 shrink-0 text-amber-500" />
                    : n.type === "verify_reward" || n.type === "referral_reward" ? <Gift className="h-5 w-5 shrink-0 text-primary" />
                    : n.type === "story_approved" || n.type === "story_confirm" ? <Heart className="h-5 w-5 shrink-0 fill-primary text-primary" />
                    : n.type === "boost_active" ? <Zap className="h-5 w-5 shrink-0 fill-amber-400 text-amber-500" />
                    : <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read_at ? "" : "font-semibold"}`}>{text(n)}</span>
                    {(n.type === "verify_rejected" || n.type === "verify_info") && n.body && <span className="mt-0.5 line-clamp-4 block whitespace-pre-line text-xs italic text-muted-foreground">“{n.body}”</span>}
                    <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(n.created_at, lang, E.justNow)}</span>
                  </span>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </Link>
                {/* 👇 කියෙව්වා / නොකියෙව්වා + මකන්න (phone එකේ හැම වෙලේම, desktop එකේ hover කළාම) */}
                <div className="flex shrink-0 flex-col gap-1 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <button type="button" onClick={() => setRead(n, !n.read_at)} title={n.read_at ? E.notifMarkUnread : E.notifMarkRead} aria-label={n.read_at ? E.notifMarkUnread : E.notifMarkRead} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary">
                    {n.read_at ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => removeOne(n)} title={E.notifRemove} aria-label={E.notifRemove} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {items.length === 0 && !showReminder && !(isAdmin && (admin.pendingVerifications || admin.unreadSupport || admin.openReports)) && (
              <li className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground"><X className="hidden" /><Bell className="h-6 w-6 opacity-40" /> {E.noNotifications}</li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
