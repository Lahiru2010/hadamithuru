"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/client";
import AvatarImage from "@/components/AvatarImage";
import { withFastAvatars } from "@/lib/avatar-client";
import { useDialog } from "@/components/DialogProvider";
import { useRouter } from "next/navigation";
import { Heart, Inbox, Send, User, Check, Clock, MessageCircle, X, Trash2, Eye, Loader2, MapPin, HeartHandshake, Ban, Bookmark, Briefcase } from "lucide-react";
import { useTr } from "@/components/OptionTranslations";
import { computeMatch } from "@/lib/match";
import { setBookmark, loadBookmarks } from "@/lib/bookmarks";
import VerifiedBadge from "@/components/VerifiedBadge";
import StoryGiftBanner from "@/components/StoryGiftBanner";
import MatchCelebration from "@/components/MatchCelebration";
import { useMyProfile } from "@/lib/useMyProfile";
import MatchBadge from "@/components/MatchBadge";
import { ProfileModal } from "@/components/ProfileModal";
import { useLang } from "@/components/providers";

// 👇 Accept කළාම photo URL එක වෙනස් වෙන්න status එක URL එකට එකතු කරනවා.
//    එතකොට browser එක පරණ (blur) photo එක cache එකෙන් නොපෙන්නා, අලුත් original එක ගන්නවා.
function photoSrcFor(item: any): string | undefined {
  const avatarUrl: string | undefined = item?.profile?.avatar_url;
  return avatarUrl?.startsWith("/api/avatar/")
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}s=${item.status}`
    : avatarUrl;
}

export default function InterestsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showConfirm, showAlert } = useDialog();
  const [loading, setLoading] = useState(true);
  const [sentInterests, setSentInterests] = useState<any[]>([]);
  const [receivedInterests, setReceivedInterests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "sent" | "matches" | "saved">("received");
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]); // 🔖 සුරැකි පැතිකඩ
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [leavingIds, setLeavingIds] = useState<string[]>([]); // 👈 අයින් වෙන cards (animation එකට)
  const [notice, setNotice] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<Record<string, { count: number; locked: boolean }>>({});
  const [blocked, setBlocked] = useState<{ id: string; full_name: string; avatar_url?: string }[]>([]);
  const [newInterestIds, setNewInterestIds] = useState<string[]>([]);
  const hasFetchedInitial = useRef(false);
  const { t } = useLang();
  const L = t.profile;
  const IT = t.interests;

  // 👇 Tabs: ලැබුණු (pending) / යැවූ (pending) / ගැලපුණු (accept කළ — දෙපැත්තෙන්ම)
  const receivedPending = receivedInterests.filter((i) => i.status === "pending");
  const sentPending = sentInterests.filter((i) => i.status === "pending");
  const sentDeclined = sentInterests.filter((i) => i.status === "rejected"); // 👈 අනිත් කෙනා ප්‍රතික්ෂේප කරපු ඒවා
  // 👇 Pagination — පිටුවකට 6යි
  const PER_PAGE = 6;
  const [page, setPage] = useState(1);
  const matches = [
    ...receivedInterests.filter((i) => i.status === "accepted").map((i) => ({ ...i, _type: "received" as const })),
    ...sentInterests.filter((i) => i.status === "accepted").map((i) => ({ ...i, _type: "sent" as const })),
  ];
  // 👇 Profile details බලන popup එක (accept / reject කරන්න කලින් බලන්න)
  const [viewing, setViewing] = useState<{ item: any; type: "sent" | "received" } | null>(null);
  const [responding, setResponding] = useState<"accept" | "reject" | null>(null);
  const [celebrate, setCelebrate] = useState<{ name: string; userId: string } | null>(null); // 🎉

  // 🔖 Bookmark කරපු profile එකක් open කරනවා — ඒ කෙනා එක්ක දැනට තියෙන ඇරයුම් තත්ත්වයටම ගැලපෙන popup එක
  //    (මට ඇරයුමක් එවලා නම් → Accept / Reject, මම යවලා නම් → "යැව්වා", ගැලපිලා නම් → Message, නැත්නම් → ඇරයුමක් යවන්න)
  const openBookmarked = (p: { id: string }) => {
    const received = receivedInterests.find((i) => i.sender_id === p.id);
    if (received) return setViewing({ item: received, type: "received" });
    const sent = sentInterests.find((i) => i.receiver_id === p.id);
    if (sent) return setViewing({ item: sent, type: "sent" });
    setViewing({ item: { id: p.id, status: "none", profile: p }, type: "sent" });
  };

  // 🔖 Bookmark කරපු පැතිකඩ (අලුත්ම එක උඩින්)
  const fetchBookmarks = async (uid: string) => {
    const { data: bm, error } = await supabase.from("bookmarks").select("profile_id, created_at").eq("user_id", uid).order("created_at", { ascending: false });
    if (error) console.error("[bookmarks] list failed:", error.message);
    const bmIds = (bm ?? []).map((b) => b.profile_id);
    if (bmIds.length) {
      const { data: bp } = await supabase.from("profiles").select("*").in("id", bmIds);
      const ordered = bmIds.map((id) => bp?.find((p) => p.id === id)).filter(Boolean);
      setSavedProfiles(await withFastAvatars(ordered as any[]));
    } else setSavedProfiles([]);
  };

  const fetchInterests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const [sentRes, receivedRes] = await Promise.all([
        supabase.from("interests").select("*").eq("sender_id", user.id).in("status", ["pending", "accepted", "rejected"]),
        supabase.from("interests").select("*").eq("receiver_id", user.id).in("status", ["pending", "accepted"])
      ]);

      const sentData = sentRes.data;
      const receivedData = receivedRes.data;

      if (receivedData) {
        const unseenIds = receivedData.filter((item) => item.is_seen === false && item.status === "pending").map((item) => item.id);
        if (!hasFetchedInitial.current) {
          setNewInterestIds(unseenIds);
          hasFetchedInitial.current = true;
          if (unseenIds.length > 0) {
            await supabase.from("interests").update({ is_seen: true }).in("id", unseenIds);
            window.dispatchEvent(new Event('refresh_interests_status'));
          }
        }
      }

      let finalSent = [];
      if (sentData && sentData.length > 0) {
        const receiverIds = sentData.map((item) => item.receiver_id);
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", receiverIds);
        finalSent = sentData.map((interest) => {
          const p = profiles?.find((prof) => prof.id === interest.receiver_id);
          return { ...interest, profile: p || null };
        }).filter(item => item.profile && item.profile.full_name);
      }
      setSentInterests(finalSent);

      let finalReceived = [];
      if (receivedData && receivedData.length > 0) {
        const senderIds = receivedData.map((item) => item.sender_id);
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", senderIds);
        finalReceived = receivedData.map((interest) => {
          const p = profiles?.find((prof) => prof.id === interest.sender_id);
          return { ...interest, profile: p || null };
        }).filter(item => item.profile && item.profile.full_name);
      }
      setReceivedInterests(finalReceived);

      // 🔖 Bookmark කරපු පැතිකඩ
      setCurrentUserId(user.id);
      await fetchBookmarks(user.id);

      // 👇 මම block කරපු අය (පිටුවේ යටින් පෙන්නන්න)
      const { data: blockRows } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
      const blockedIds = (blockRows ?? []).map((b) => b.blocked_id);
      if (blockedIds.length) {
        const { data: bp } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", blockedIds);
        setBlocked(bp ?? []);
      } else setBlocked([]);

      // 👇 Popup එකේ photos කොටස ඒ ගමන්ම පෙන්නන්න — හැමෝගෙම photos ගණන එක request එකකින්
      const ids = [...finalSent, ...finalReceived].map((i: any) => i.profile.id);
      if (ids.length) {
        fetch("/api/photos/meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: ids }) })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.meta && setPhotoMeta(d.meta));
      }


    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterests(); }, [router]);

  // 🔖 Popup එකෙන් (හෝ වෙන තැනකින්) bookmark කළාම / අයින් කළාම Bookmarks tab එක ගමන්ම update වෙනවා
  useEffect(() => {
    if (!currentUserId) return;
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<{ profileId: string; bookmarked: boolean }>).detail;
      if (d && !d.bookmarked) setSavedProfiles((list) => list.filter((x) => x.id !== d.profileId));
      else fetchBookmarks(currentUserId);
    };
    window.addEventListener("bookmarks-changed", onChange);
    // ⚡ Realtime — වෙන tab එකකින් / phone එකෙන් bookmark කළත් මෙතන ගමන්ම update වෙනවා
    const channel = supabase
      .channel(`bookmarks-${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookmarks" }, (payload) => {
        const row = (payload.new && Object.keys(payload.new).length ? payload.new : payload.old) as { user_id?: string } | null;
        if (row?.user_id && row.user_id !== currentUserId) return;
        loadBookmarks(true); // popup එකේ බොත්තමත් sync වෙන්න
        fetchBookmarks(currentUserId);
      })
      .subscribe();
    return () => {
      window.removeEventListener("bookmarks-changed", onChange);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleAccept = async (interestId: string) => {
    const { error } = await supabase.from("interests").update({ status: "accepted" }).eq("id", interestId);
    if (!error) {
      // 🎉 සුබ පැතුම් popup එක (profile popup එක open නම් ඒකට උඩින්)
      const it = receivedInterests.find((x) => x.id === interestId);
      if (it?.profile) setCelebrate({ name: it.profile.full_name ?? "", userId: it.profile.id });
      window.dispatchEvent(new Event("refresh_interests_status"));
      setReceivedInterests((prev) => prev.map((item) => (item.id === interestId ? { ...item, status: "accepted" } : item)));
      setNotice(IT.movedToMatches);
      setActiveTab("matches"); // 👈 Accept කළ ගමන් "ගැලපුණු" tab එක
      setTimeout(() => setNotice(null), 3500);
      // 👇 Accept කළ ගමන් "NEW" highlight එක අයින් කරනවා
      setNewInterestIds((prev) => prev.filter((id) => id !== interestId));
    }
    else showAlert({ title: "Something went wrong", message: error.message, tone: "error" });
  };

  // 👇 Card එක ක්ෂණිකව fade වෙලා අයින් වෙනවා (server එකේ වැඩේ පිටිපස්සෙන්). වැරදුණොත් ආපහු එනවා.
  const removeOptimistic = async (interestId: string, status: "rejected" | "removed") => {
    const snapshotSent = sentInterests;
    const snapshotReceived = receivedInterests;
    setLeavingIds((ids) => [...ids, interestId]);
    setTimeout(() => {
      setReceivedInterests((prev) => prev.filter((item) => item.id !== interestId));
      setSentInterests((prev) => prev.filter((item) => item.id !== interestId));
      setLeavingIds((ids) => ids.filter((x) => x !== interestId));
    }, 300);
    const { error } = await supabase.from("interests").update({ status }).eq("id", interestId);
    if (error) {
      setSentInterests(snapshotSent);
      setReceivedInterests(snapshotReceived);
      showAlert({ title: "Something went wrong", message: error.message, tone: "error" });
    } else {
      window.dispatchEvent(new Event("refresh_interests_status"));
    }
  };

  const handleReject = async (interestId: string) => removeOptimistic(interestId, "rejected");

  const handleRemove = async (interestId: string, type: "sent" | "received") => {
    const item = [...sentInterests, ...receivedInterests].find((i) => i.id === interestId);
    const name = item?.profile?.full_name || "this person";
    const isPendingSent = type === "sent" && item?.status === "pending";

    const ok = await showConfirm(
      isPendingSent
        ? {
            title: "Cancel your interest?",
            message: `Your interest request to ${name} will be withdrawn.`,
            confirmText: "Cancel interest",
            cancelText: "Keep it",
            tone: "danger",
          }
        : {
            title: `Remove ${name}?`,
            message: "They will be removed from your interests and you won't be able to chat with each other anymore.",
            confirmText: "Remove",
            tone: "danger",
          }
    );
    if (!ok) return;

    void type;
    await removeOptimistic(interestId, "removed");
  };

  const unblock = async (person: { id: string; full_name: string }) => {
    const ok = await showConfirm({ title: IT.unblockTitle.replace("{name}", person.full_name), message: IT.unblockMsg, confirmText: IT.unblock });
    if (!ok) return;
    setBlocked((b) => b.filter((x) => x.id !== person.id));
    const res = await fetch("/api/block", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: person.id }) });
    if (!res.ok) { setBlocked((b) => [...b, person]); showAlert({ title: "Something went wrong", tone: "error" }); }
  };

  if (loading) {
    // 👇 Skeleton එක ඇත්ත UI එකේ හැඩයටම (header → tab cards 4 → hint → cards 2 columns, actions පේළිය එක්ක)
    return (
      <main className="min-h-screen bg-background relative overflow-hidden" aria-busy="true">
        <div className="mx-auto max-w-5xl px-4 py-12 relative z-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-2.5">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-72 max-w-[60vw] animate-pulse rounded-md bg-muted/70" />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className={`h-10 w-10 shrink-0 animate-pulse rounded-xl ${i === 0 ? "bg-primary/20" : "bg-muted"}`} />
                <div className="space-y-2">
                  <div className="h-6 w-8 animate-pulse rounded-md bg-muted" />
                  <div className="h-3.5 w-16 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
          <div className="mb-6 h-4 w-80 max-w-full animate-pulse rounded bg-muted/60" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
                <div className="flex gap-4 p-4">
                  <div className="h-24 w-24 shrink-0 animate-pulse rounded-2xl bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
                      <div className="h-6 w-14 animate-pulse rounded-full bg-muted/70" />
                    </div>
                    <div className="h-3.5 w-40 animate-pulse rounded bg-muted/70" />
                    <div className="h-3.5 w-28 animate-pulse rounded bg-muted/70" />
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
                <div className="mt-auto flex gap-2 border-t border-border bg-muted/30 px-4 py-3">
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
                  <div className="h-10 w-24 animate-pulse rounded-xl bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-rose-300/45 to-red-100/50 dark:from-rose-900/20 dark:to-orange-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="mx-auto max-w-5xl px-4 py-12 relative z-10">
        {/* 👇 Header — වම් පැත්තට, අනිත් pages වගේ */}
        <div className="mb-8 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/25"><Heart className="h-7 w-7 fill-current" /></span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">{IT.title}</h1>
            <p className="mt-1 text-muted-foreground">{IT.subtitle}</p>
          </div>
        </div>

        {/* 👇 Tabs 4 — ගණන් එක්ක cards විදිහට (phone එකේ 2×2) */}
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {([
            { id: "received", label: IT.received, icon: Inbox, count: receivedPending.length },
            { id: "sent", label: IT.sent, icon: Send, count: sentPending.length },
            { id: "matches", label: IT.matches, icon: HeartHandshake, count: matches.length },
            { id: "saved", label: t.extra.bookmarksTab, icon: Bookmark, count: savedProfiles.length },
          ] as const).map(({ id, label, icon: Icon, count }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setPage(1); }}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${active ? "border-transparent bg-gradient-to-br from-[#D61F55] to-[#B5123F] text-white shadow-lg shadow-primary/25" : "border-border bg-background text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/40"}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block text-2xl font-extrabold leading-none">{count}</span>
                  <span className={`mt-1 block truncate text-sm font-semibold ${active ? "text-white/90" : "text-muted-foreground"}`}>{label}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* 👇 තෝරපු tab එකේ කෙටි පැහැදිලි කිරීම */}
        <p className="mb-6 px-1 text-sm text-muted-foreground">
          {activeTab === "received" ? IT.hintReceived : activeTab === "sent" ? IT.hintSent : activeTab === "matches" ? IT.hintMatches : IT.hintBookmarks}
        </p>
        {/* 💍 ගැලපුණු tab එකේ: ආදර කතාව බෙදාගෙන තෑග්ගක් ගන්න */}
        {activeTab === "matches" && matches.length > 0 && <StoryGiftBanner className="mb-6" />}

        {notice && <p role="status" className="mb-6 rounded-xl bg-green-500/10 px-4 py-3 text-center text-sm font-semibold text-green-700 dark:text-green-400">✓ {notice}</p>}

        {/* 🔖 Bookmarks tab එක */}
        {activeTab === "saved" && (
          savedProfiles.length === 0 ? <EmptyState text={t.extra.emptyBookmarks} /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {savedProfiles.map((p) => (
                <div key={p.id} role="button" tabIndex={0} onClick={() => openBookmarked(p)} onKeyDown={(e) => { if (e.key === "Enter") openBookmarked(p); }} className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex items-center gap-4 p-4">
                    <AvatarImage src={p.avatar_url} alt={p.full_name} shape="rounded-2xl" className="h-20 w-20 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-lg font-bold group-hover:text-primary"><span className="truncate">{p.full_name}</span>{p.id_verified === "Yes" && <VerifiedBadge />}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{[p.age && L.age.replace("{age}", String(p.age)), p.city || p.district, p.country].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  {/* 👇 Actions — card එකේ කෙළවරට හිරවෙන්නේ නැතුව, වෙනම පේළියක */}
                  <div className="mt-auto flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openBookmarked(p)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary/50 hover:text-primary">
                      <Eye className="h-4 w-4" /> {IT.viewProfile}
                    </button>
                    <button
                      onClick={async () => {
                        setSavedProfiles((list) => list.filter((x) => x.id !== p.id));
                        // 👇 එකම store එක හරහා — popup එකේ බොත්තමත් ගමන්ම update වෙනවා
                        const err = await setBookmark(p.id, false);
                        if (err) {
                          fetchBookmarks(currentUserId);
                          showAlert({ title: t.extra.removeBookmark, message: `${t.extra.bookmarkError} (${err})`, tone: "error" });
                        }
                      }}
                      aria-label={t.extra.removeBookmark}
                      title={t.extra.removeBookmark}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <Bookmark className="h-4 w-4 fill-current" /> <span className="hidden sm:inline">{IT.remove}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        <div className={`grid gap-4 md:grid-cols-2 ${activeTab === "saved" ? "hidden" : ""}`}>
          {(() => {
            if (activeTab === "saved") return null;
            const list = activeTab === "received" ? receivedPending.map((i) => ({ ...i, _type: "received" as const })) : activeTab === "sent" ? sentPending.map((i) => ({ ...i, _type: "sent" as const })) : matches;
            if (list.length === 0) return <EmptyState text={activeTab === "received" ? IT.emptyReceived : activeTab === "sent" ? IT.emptySent : IT.emptyMatches} />;
            const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
            const current = Math.min(page, totalPages);
            const visible = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
            return (<>
            {visible.map((item) => (
              <div
                key={item.id}
                className={`h-full transition-all duration-300 ${leavingIds.includes(item.id) ? "pointer-events-none -translate-x-4 scale-95 opacity-0" : ""}`}
              >
                <InterestCard
                  data={item}
                  type={item._type}
                  isNew={newInterestIds.includes(item.id)}
                  labels={{ details: L.details, accept: L.accept, reject: L.reject, chat: L.chat, remove: IT.remove, cancel: IT.cancel, pending: L.pending, matched: L.matched, likesYou: L.likesYou }}
                  onView={() => setViewing({ item, type: item._type })}
                  onAccept={item._type === "received" ? () => handleAccept(item.id) : undefined}
                  onReject={item._type === "received" ? () => handleReject(item.id) : undefined}
                  onRemove={() => handleRemove(item.id, item._type)}
                />
              </div>
            ))}
            {/* 👇 6කට වඩා තියෙනවා නම් පිටු */}
            {totalPages > 1 && (
              <nav className="mt-2 flex items-center justify-center gap-2 md:col-span-2" aria-label="Pagination">
                <button disabled={current === 1} onClick={() => { setPage(current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary/50 disabled:opacity-40">{t.extra.prevPage}</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-current={n === current ? "page" : undefined} className={`h-10 w-10 rounded-xl text-sm font-bold transition ${n === current ? "bg-primary text-white shadow-md" : "border border-border hover:border-primary/50"}`}>{n}</button>
                ))}
                <button disabled={current === totalPages} onClick={() => { setPage(current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary/50 disabled:opacity-40">{t.extra.nextPage}</button>
              </nav>
            )}
            </>);
          })()}
        </div>

        {/* 👇 යැවූ tab එකේ යටින්: ප්‍රතික්ෂේප වුණු ඒවා (හකුළලා) */}
        {activeTab === "sent" && sentDeclined.length > 0 && (
          <details className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-muted-foreground">
              <X className="h-4 w-4" /> {t.extra.declined} <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{sentDeclined.length}</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{t.extra.declinedHint}</p>
            <ul className="mt-4 divide-y divide-border">
              {sentDeclined.map((i) => (
                <li key={i.id} className={`flex items-center gap-3 py-3 transition-all duration-300 ${leavingIds.includes(i.id) ? "opacity-0" : ""}`}>
                  <span className="flex-1 font-medium text-muted-foreground">{i.profile?.full_name}</span>
                  <button onClick={() => removeOptimistic(i.id, "removed")} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">{t.extra.dismiss}</button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* 👇 Block කළ අය — unblock කරන්න */}
        {blocked.length > 0 && (
          <details className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-muted-foreground">
              <Ban className="h-4 w-4" /> {IT.blockedTitle} <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{blocked.length}</span>
            </summary>
            <ul className="mt-4 divide-y divide-border">
              {blocked.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="font-medium">{p.full_name}</span>
                  <button onClick={() => unblock(p)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-primary/50 hover:text-primary">{IT.unblock}</button>
                </li>
              ))}
            </ul>
          </details>
        )}

      </div>

      {/* 👇 සම්පූර්ණ profile එක බලලා තමයි accept / reject කරන්නේ */}
      {viewing && (() => {
        const { item, type } = viewing;
        const isPendingReceived = type === "received" && item.status === "pending";
        const profile = {
          ...item.profile,
          avatar_url: photoSrcFor(item),
          isBlurred: item.profile?.blur_photo === true && item.status !== "accepted",
          interestStatus: item.status === "none" ? "none" : item.status === "accepted" ? "accepted" : type === "sent" ? "sent" : "received",
          photo_meta: photoMeta[item.profile?.id] ?? null,
        };
        const respond = async (action: "accept" | "reject") => {
          setResponding(action);
          if (action === "accept") {
            await handleAccept(item.id);
            // 👇 Popup එක වහන්නේ නෑ — ගැලපුණු තත්ත්වයට (photos / chat) මාරු වෙනවා, උඩින් සුබ පැතුම
            setViewing((v) => (v ? { ...v, item: { ...v.item, status: "accepted" } } : v));
          } else {
            await handleReject(item.id);
            setViewing(null);
          }
          setResponding(null);
        };
        return (
          <ProfileModal
            profile={profile}
            onClose={() => setViewing(null)}
            onBlocked={() => fetchInterests()}
            onSendInterest={async (id) => {
              // 🔖 සුරැකි පැතිකඩකින් අලුතින් ඇරයුමක් යවනවා නම්
              if (item.status === "none") {
                const { error } = await supabase.from("interests").insert({ sender_id: currentUserId, receiver_id: id });
                if (error) return { status: "error" as const, message: error.message };
                fetchInterests();
                return { status: "sent" as const };
              }
              router.push(`/chat?userId=${id}`);
              return { status: "navigated" as const };
            }}
            footer={
              isPendingReceived ? (
                <div>
                  <p className="mb-3 text-center text-xs text-muted-foreground">{L.reviewBeforeAccept}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => respond("reject")}
                      disabled={!!responding}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-4 text-base font-bold text-muted-foreground transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-60"
                    >
                      {responding === "reject" ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />} {L.reject}
                    </button>
                    <button
                      onClick={() => respond("accept")}
                      disabled={!!responding}
                      className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] py-4 text-base font-bold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
                    >
                      {responding === "accept" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} {L.accept}
                    </button>
                  </div>
                </div>
              ) : undefined
            }
          />
        );
      })()}
      {celebrate && <MatchCelebration name={celebrate.name} userId={celebrate.userId} onClose={() => setCelebrate(null)} />}
    </main>
  );
}

type CardLabels = { details: string; accept: string; reject: string; chat: string; remove: string; cancel: string; pending: string; matched: string; likesYou: string };

function InterestCard({ data, type, isNew = false, onView, onAccept, onReject, onRemove, labels }: { data: any, type: "sent" | "received", isNew?: boolean, onView: () => void, onAccept?: () => Promise<void> | void, onReject?: () => Promise<void> | void, onRemove?: () => void, labels: CardLabels }) {
  const profile = data.profile;
  const status = data.status;
  const photoSrc = photoSrcFor(data);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const { t } = useLang();
  const tr = useTr();
  const me = useMyProfile();
  const match = me ? computeMatch(me, profile) : null; // 👈 ගැලපීමේ ප්‍රතිශතය
  // 👇 Card එකේම ප්‍රධාන විස්තර ටික: වයස · ස්ත්‍රී/පුරුෂ · ස්ථානය · රැකියාව
  const place = [profile?.city || profile?.district, profile?.country].filter(Boolean).map((x: string) => String(tr(x))).join(", ");
  const facts = [
    profile?.age ? { icon: User, text: `${t.profile.age.replace("{age}", String(profile.age))}${profile?.gender ? ` · ${tr(profile.gender)}` : ""}` } : null,
    place ? { icon: MapPin, text: place } : null,
    profile?.job_title ? { icon: Briefcase, text: String(tr(profile.job_title)) } : null,
  ].filter(Boolean) as { icon: typeof User; text: string }[];
  const act = async (kind: "accept" | "reject") => {
    setBusy(kind);
    await (kind === "accept" ? onAccept?.() : onReject?.());
    setBusy(null);
  };
  // 👇 තත්ත්වය පෙන්නන පොඩි chip එක
  const chip = status === "accepted"
    ? { text: labels.matched, cls: "bg-green-500/10 text-green-700 dark:text-green-400", icon: HeartHandshake }
    : type === "received"
      ? { text: labels.likesYou, cls: "bg-primary/10 text-primary", icon: Heart }
      : { text: labels.pending, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", icon: Clock };

  return (
    // 👇 Card එකේ ඕනම තැනක click කළාම විස්තර popup එක (buttons වලට තමන්ගේම වැඩ)
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter") onView(); }}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-background shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${isNew ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
    >
      <div className="flex gap-4 p-4">
        <div className="relative shrink-0">
          <AvatarImage src={photoSrc} alt={profile?.full_name ?? "avatar"} shape="rounded-2xl" className="h-24 w-24 shadow-sm ring-2 ring-primary/10 transition group-hover:ring-primary/30" />
          {isNew && <span className="absolute -left-1.5 -top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-md">NEW</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1.5 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
              <span className="truncate">{profile?.full_name || "Unknown User"}</span>
              {profile?.id_verified === "Yes" && <VerifiedBadge />}
            </h3>
            {match && <MatchBadge percent={match.percent} label={t.match.percent.replace("{p}", String(match.percent))} />}
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 truncate capitalize"><Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" /> <span className="truncate">{text}</span></li>
            ))}
          </ul>
          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${chip.cls}`}><chip.icon className="h-3.5 w-3.5" /> {chip.text}</span>
        </div>
      </div>

      {/* 👇 Actions — වෙනම පේළියක (කෙළවරට හිරවෙන්නේ නෑ) */}
      <div className="mt-auto flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {status === "accepted" ? (
          <>
            <a href={profile ? `/chat?userId=${profile.id}` : "#"} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition hover:opacity-90"><MessageCircle className="h-4 w-4" /> {labels.chat}</a>
            <button onClick={onRemove} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-red-500/40 hover:text-red-500"><Trash2 className="h-4 w-4" /> {labels.remove}</button>
          </>
        ) : type === "received" ? (
          // 👇 කෙලින්ම Accept / Reject කරන්නත් පුළුවන්, "විස්තර" එකෙන් සම්පූර්ණ profile එක බලලා popup එකේ ඉඳන් කරන්නත් පුළුවන්
          <>
            <button onClick={onView} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"><Eye className="h-4 w-4" /> <span className="hidden sm:inline">{labels.details}</span></button>
            <button onClick={() => act("accept")} disabled={!!busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D61F55] to-[#B5123F] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/20 transition hover:opacity-90 disabled:opacity-60">{busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {labels.accept}</button>
            <button onClick={() => act("reject")} disabled={!!busy} aria-label={labels.reject} title={labels.reject} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-red-500/40 hover:text-red-500 disabled:opacity-60">{busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}</button>
          </>
        ) : (
          <>
            <button onClick={onView} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"><Eye className="h-4 w-4" /> {labels.details}</button>
            <button onClick={onRemove} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-red-500/40 hover:text-red-500"><X className="h-4 w-4" /> {labels.cancel}</button>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    // 👇 md:col-span-2 — columns 2ක grid එක ඇතුළේ තිබ්බත් සම්පූර්ණ පළලටම
    <div className="flex w-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/80 bg-background/60 px-6 py-24 text-center backdrop-blur-sm md:col-span-2">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Heart className="h-8 w-8 text-primary/60" /></span>
      <p className="max-w-md font-medium text-muted-foreground">{text}</p>
    </div>
  );
}