// app/chat/page.tsx
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { createClient } from "@/lib/client";
import { withFastAvatars } from "@/lib/avatar-client";
import AvatarImage from "@/components/AvatarImage";
import { useDialog } from "@/components/DialogProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, User, ArrowLeft, Check, CheckCheck, Trash2, MessageCircle, Info, Ban, ShieldCheck, ImagePlus } from "lucide-react";
import imageCompression from "browser-image-compression";
import ChatPhoto from "@/components/chat/ChatPhoto";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import VoicePlayer from "@/components/chat/VoicePlayer";
import VerifiedBadge from "@/components/VerifiedBadge";
import EmojiPicker from "@/components/chat/EmojiPicker";
import PhotoSendDialog from "@/components/chat/PhotoSendDialog";
import { ProfileModal } from "@/components/ProfileModal";
import { useLang } from "@/components/providers";
import { refreshChatTimes } from "@/components/chat/LastChatTime";
import { lastSeenText } from "@/lib/last-seen";
import { useOnlineUsers } from "@/lib/presence";

function ChatDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const supabase = createClient();
  const { showConfirm, showAlert } = useDialog();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [lastAt, setLastAt] = useState<Record<string, string>>({}); // 👈 එක් එක් කෙනා එක්ක අන්තිම message එකේ වෙලාව
  const [lastText, setLastText] = useState<Record<string, string>>({}); // 👈 අන්තිම message එකේ කෙටි පෙරදසුන
  const [, setTick] = useState(0); // "විනාඩි 5කට පෙර" වගේ වෙලාවල් විනාඩියකට සැරයක් update වෙන්න
  const [activeUser, setActiveUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false); // 👈 Chat header එක click කළාම profile details
  const [photoMeta, setPhotoMeta] = useState<{ count: number; locked: boolean } | null>(null);
  // 👇 Messages page එකේ ඉන්නකොට විතරක් page scrollbar එක අයින් කරනවා, page එකෙන් යනකොට ආපහු දානවා.
  //    (කලින් <style> එකකින් කළා — React ඒ style එක page එකෙන් ගියාටත් අයින් කරන්නේ නැති නිසා
  //     අනිත් pages scroll නොවී තිබුණා. ඒ bug එක මේකෙන් fix වෙනවා.)
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    const prevGutter = html.style.scrollbarGutter;
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "auto"; // 👈 දකුණු පැත්තේ හිස් scrollbar ඉඩ (margin) එක අයින් කරනවා
    document.body.style.overflow = "hidden";
    return () => { html.style.overflow = prevHtml; html.style.scrollbarGutter = prevGutter; document.body.style.overflow = prevBody; };
  }, []);

  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; url: string } | null>(null); // 👈 යවන්න තෝරපු ඡායාරූපය
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 👇 Chat එක open කළ ගමන් ඒ කෙනාගේ photos ගණන කලින්ම අරගන්නවා (popup එකේ ඒ ගමන්ම පේන්න)
  useEffect(() => {
    setPhotoMeta(null);
    const id = activeUser?.id;
    if (!id) return;
    fetch("/api/photos/meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: [id] }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.meta?.[id] && setPhotoMeta(d.meta[id]));
  }, [activeUser?.id]);
  const { t, lang } = useLang();
  const presence = useOnlineUsers(); // 🟢 Realtime online අය
  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 60_000); return () => clearInterval(id); }, []);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true); 
  
  const activeUserRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

  useEffect(() => {
    refreshChatTimes(); // Page එකට ආපු හැම පාරම අලුත් වෙලාවල්
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setCurrentUser(user);

      const { data: interests } = await supabase.from("interests").select("sender_id, receiver_id").eq("status", "accepted").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (interests) {
        const rawUserIds = interests.map(i => i.sender_id === user.id ? i.receiver_id : i.sender_id);
        const userIds = Array.from(new Set(rawUserIds));
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("*").in("id", userIds);
          // 👇 හැමෝ එක්කම අන්තිම message එකේ වෙලාව — server එකෙන් (list එක ඒ අනුව පිළිවෙළට)
          const latest: Record<string, string> = await fetch("/api/chat/last-times", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { times: {} }))
            .then((d) => d.times ?? {})
            .catch(() => ({}));
          console.info("[chat] last message times:", latest); // 🔎 Debug — Console එකේ මේක පේනවා
          setLastAt(latest);

          if (profiles) {
            const sorted = [...profiles].sort((a, b) => (latest[b.id] ?? "").localeCompare(latest[a.id] ?? ""));
            setChatUsers(await withFastAvatars(sorted));
          }

          const { data: unreadMsgs } = await supabase.from("messages").select("sender_id").eq("receiver_id", user.id).eq("is_read", false);
          if (unreadMsgs) {
            const counts: { [key: string]: number } = {};
            unreadMsgs.forEach(msg => { counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1; });
            setUnreadCounts(counts);
          }
        }
      }
      setLoading(false);
    };
    initDashboard();
  }, [router]);

  const handleUserClick = async (user: any) => {
    setActiveUser(user);
    setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));

    const { data: msgs } = await supabase.from("messages").select("*").or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`).order("created_at", { ascending: true });
    // 👇 Conversation එක load වුණාම ඒකෙන්ම අන්තිම වෙලාවත් update කරනවා
    if (msgs && msgs.length) {
      setLastAt((prev) => ({ ...prev, [user.id]: msgs[msgs.length - 1].created_at }));
      window.dispatchEvent(new CustomEvent("chat-last-time", { detail: { id: user.id, at: msgs[msgs.length - 1].created_at } }));
    }
    if (msgs) setMessages(msgs);

    await supabase.from("messages").update({ is_read: true }).eq("receiver_id", currentUser.id).eq("sender_id", user.id).eq("is_read", false);
    window.dispatchEvent(new Event('refresh_unread_status'));
  };

  useEffect(() => {
    if (targetUserId && chatUsers.length > 0 && currentUser) {
      const userToOpen = chatUsers.find(u => u.id === targetUserId);
      if (userToOpen && activeUser?.id !== userToOpen.id) handleUserClick(userToOpen);
    }
  }, [targetUserId, chatUsers, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const channelName = `chat_room_${currentUser.id}_${Math.random()}`;

    const subscription = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, async (payload) => {
        const newMsg = payload.new;
        const currentActiveUser = activeUserRef.current;
        setLastAt((prev) => ({ ...prev, [newMsg.sender_id]: newMsg.created_at }));
        window.dispatchEvent(new CustomEvent("chat-last-time", { detail: { id: newMsg.sender_id, at: newMsg.created_at } }));
        setLastText((prev) => ({ ...prev, [newMsg.sender_id]: newMsg.image_path ? "📷" : newMsg.audio_path ? `🎤 ${t.chat.voiceLabel}` : newMsg.content }));

        if (currentActiveUser && currentActiveUser.id === newMsg.sender_id) {
          if (!document.hasFocus()) setUnreadCounts(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }));
          else await supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
          
          setMessages((prev) => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        } else {
          setUnreadCounts(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [currentUser]); 

  useEffect(() => {
    const handleFocus = async () => {
      if (activeUser && currentUser) {
        setUnreadCounts(prev => ({ ...prev, [activeUser.id]: 0 }));
        await supabase.from("messages").update({ is_read: true }).eq("receiver_id", currentUser.id).eq("sender_id", activeUser.id).eq("is_read", false);
        window.dispatchEvent(new Event('refresh_unread_status'));
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => { window.removeEventListener("focus", handleFocus); };
  }, [activeUser, currentUser]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeUser) return;
    const msgText = newMessage;
    setNewMessage(""); 
    const { data, error } = await supabase.from("messages").insert({ sender_id: currentUser.id, receiver_id: activeUser.id, content: msgText }).select().single();
    if (!error && data) {
      setMessages((prev) => prev.find(m => m.id === data.id) ? prev : [...prev, data]);
      setLastAt((prev) => ({ ...prev, [activeUser.id]: data.created_at }));
      window.dispatchEvent(new CustomEvent("chat-last-time", { detail: { id: activeUser.id, at: data.created_at } }));
      setLastText((prev) => ({ ...prev, [activeUser.id]: `✓ ${data.content}` }));
    }
  };

  // 📷 ඡායාරූපයක් තෝරනවා → compress කරනවා → preview dialog එක
  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    // 👇 Upload කරන්න කලින් compress කරනවා (ඉඩ / data ඉතුරු කරන්න) — server එකෙත් ආයේ WebP එකට හකුළනවා
    const compressed = await imageCompression(f, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, initialQuality: 0.8, useWebWorker: true, fileType: "image/webp" }).catch(() => f);
    setPendingPhoto({ file: compressed, url: URL.createObjectURL(compressed) });
  };

  const sendPhoto = async (file: File, viewOnce: boolean) => {
    if (!activeUser) return false;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("receiverId", activeUser.id);
    fd.append("viewOnce", String(viewOnce));
    const res = await fetch("/api/chat/image", { method: "POST", body: fd });
    if (!res.ok) return false;
    const { message } = await res.json();
    // 👇 යවපු photo එක ඒ ගමන්ම පෙන්නන්න local preview එකත් එක්ක (server එකෙන් load වෙනකම් බලන් ඉන්න ඕන නෑ)
    if (message) {
      setMessages((prev) => (prev.find((m) => m.id === message.id) ? prev : [...prev, { ...message, _localUrl: viewOnce ? undefined : pendingPhoto?.url }]));
      setLastAt((prev) => ({ ...prev, [activeUser.id]: message.created_at })); // 🔝 list එකේ උඩට
    }
    setPendingPhoto(null);
    return true;
  };

  // 🔝 අලුත්ම message එක තියෙන chat එක උඩින්ම (අලුත් message එකක් ආපු ගමන් / යැව්ව ගමන් උඩට එනවා)
  const sortedChatUsers = [...chatUsers].sort((a, b) => (lastAt[b.id] ?? "").localeCompare(lastAt[a.id] ?? ""));

  // 🗑️ Chat එක සම්පූර්ණයෙන්ම ඉවත් කරනවා — messages (දෙපැත්තෙන්ම), files, match එක
  const removeConversation = async (user: { id: string; full_name?: string | null }) => {
    const C = t.chat;
    const ok = await showConfirm({ title: C.removeChatTitle.replace("{name}", user.full_name || ""), message: C.removeChatMsg, confirmText: C.removeChatConfirm, tone: "danger" });
    if (!ok) return;
    const res = await fetch("/api/chat/conversation", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
    if (!res.ok) return showAlert({ title: "Something went wrong", tone: "error" });
    setChatUsers((list) => list.filter((u) => u.id !== user.id));
    if (activeUser?.id === user.id) { setActiveUser(null); setMessages([]); }
    window.dispatchEvent(new Event("refresh_unread_status"));
    window.dispatchEvent(new Event("refresh_interests_status"));
    showAlert({ title: C.removeChatDone, tone: "success" });
  };

  // 😊 Emoji එක cursor එක තියෙන තැනට
  const messageInputRef = useRef<HTMLInputElement>(null);
  const insertEmoji = (emoji: string) => {
    const el = messageInputRef.current;
    const start = el?.selectionStart ?? newMessage.length;
    const end = el?.selectionEnd ?? newMessage.length;
    setNewMessage((m) => m.slice(0, start) + emoji + m.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  // 🎤 හඬ පණිවිඩයක් යවනවා
  const [voiceActive, setVoiceActive] = useState(false); // 👈 පටිගත කරනකොට text box එක හංගනවා
  const sendVoice = async (blob: Blob, seconds: number) => {
    if (!activeUser) return false;
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    const fd = new FormData();
    fd.append("file", new File([blob], `voice.${ext}`, { type: blob.type }));
    fd.append("receiverId", activeUser.id);
    fd.append("duration", String(seconds));
    const res = await fetch("/api/chat/voice", { method: "POST", body: fd });
    if (!res.ok) return false;
    const { message } = await res.json();
    // 👇 යවපු කෙනාට ඒ ගමන්ම local copy එකෙන් play කරන්න (ආයේ download කරන්න ඕන නෑ)
    if (message) {
      setMessages((prev) => (prev.find((m) => m.id === message.id) ? prev : [...prev, { ...message, _localAudio: URL.createObjectURL(blob) }]));
      setLastAt((prev) => ({ ...prev, [activeUser.id]: message.created_at }));
      setLastText((prev) => ({ ...prev, [activeUser.id]: `✓ 🎤 ${t.chat.voiceLabel}` }));
    }
    return true;
  };

  // 🚫 Chat එකේ ඉඳන්ම block කරන්න (confirmation එකක් එක්ක)
  const handleBlock = async () => {
    if (!activeUser) return;
    const IT = t.interests;
    const name = activeUser.full_name || "";
    const ok = await showConfirm({ title: IT.blockTitle.replace("{name}", name), message: IT.blockMsg, confirmText: IT.block, tone: "danger" });
    if (!ok) return;
    const res = await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: activeUser.id }) });
    if (!res.ok) return showAlert({ title: "Something went wrong", tone: "error" });
    setChatUsers((users) => users.filter((u) => u.id !== activeUser.id));
    setActiveUser(null);
    setShowProfile(false);
    window.dispatchEvent(new Event("refresh_interests_status"));
    showAlert({ title: IT.blockDone.replace("{name}", name), tone: "success" });
  };

  const handleDeleteMessage = async (msgId: string) => {
    const ok = await showConfirm({
      title: "Delete message?",
      message: "This message will be removed from the conversation.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    // 🎤 හඬ පණිවිඩයක් නම් server එකෙන් — audio file එකත් storage එකෙන් මැකෙනවා (ඉඩ ඉතුරු කරන්න)
    const m = messages.find((x) => x.id === msgId);
    if (m?.audio_path) {
      const res = await fetch(`/api/chat/voice/${msgId}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.map((x) => (x.id === msgId ? { ...x, is_deleted: true } : x)));
      return;
    }
    await supabase.from("messages").update({ is_deleted: true }).eq("id", msgId);
  };

  if (loading) {
    return (
      <main className="chat-page relative h-[calc(100dvh-var(--nav-h,73px))] bg-background flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex max-w-[1600px] w-full mx-auto overflow-hidden border-x border-border shadow-2xl">
          <div className="w-full md:w-80 lg:w-96 border-r border-border bg-background flex-col h-full flex">
            <div className="p-4 border-b border-border"><div className="h-6 w-24 bg-muted rounded-md animate-pulse" /></div>
            <div className="p-4 space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1"><div className="h-4 w-24 bg-muted rounded-md animate-pulse" /><div className="h-3 w-32 bg-muted rounded-md animate-pulse" /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex-col h-full bg-muted/10 hidden md:flex">
            <div className="p-4 border-b border-border bg-background shadow-sm flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-muted animate-pulse" /><div className="h-5 w-32 bg-muted rounded-md animate-pulse" /></div>
            <div className="flex-1 p-4 space-y-6">
              <div className="flex justify-end"><div className="w-48 h-10 bg-muted rounded-2xl animate-pulse" /></div>
              <div className="flex justify-start"><div className="w-64 h-14 bg-muted rounded-2xl animate-pulse" /></div>
              <div className="flex justify-end"><div className="w-32 h-10 bg-muted rounded-2xl animate-pulse" /></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    {/* 👇 Chat page එකේ අකුරු ටිකක් ලොකු කරනවා */}
    <style href="chat-page-text" precedence="default">
      {`.chat-page .text-sm{font-size:1rem;line-height:1.5rem}.chat-page .text-xs{font-size:.875rem;line-height:1.25rem}.chat-page .text-\[10px\]{font-size:.75rem}`}
    </style>
    <main className="chat-page relative h-[calc(100dvh-var(--nav-h,73px))] bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex max-w-[1600px] w-full mx-auto overflow-hidden border-x border-border shadow-2xl">
        <div className={`w-full md:w-80 lg:w-96 border-r border-border bg-background flex-col h-full ${activeUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border"><h2 className="text-xl font-bold">Messages</h2></div>
          <div className="flex-1 divide-y divide-border overflow-y-auto">
            {/* 👆 divide-y — හැම user කෙනෙක්ම ඉරකින් වෙන් වෙලා */}
            {chatUsers.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-sm">No chats yet. Send interests to start chatting!</p>
            ) : (
              sortedChatUsers.map(user => (
                <div key={user.id} className="group relative">
                <button onClick={() => handleUserClick(user)} className={`w-full flex items-center gap-3 p-4 pr-12 hover:bg-muted/50 transition-colors cursor-pointer ${activeUser?.id === user.id ? 'bg-muted shadow-[inset_4px_0_0_0_var(--primary)]' : ''}`}>
                  <div className="relative">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} className="w-12 h-12" />
                    {unreadCounts[user.id] > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-background">{unreadCounts[user.id]}</span>}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="flex items-center gap-1 font-semibold text-sm"><span className="truncate">{user.full_name}</span>{user.id_verified === "Yes" && <VerifiedBadge />}</h3>
                    {/* 👇 අන්තිමට chat කරපු වෙලාව විතරයි ("විනාඩි 10කට පෙර") — message එක පෙන්නන්නේ නෑ */}
                    {/* 👇 නමට යටින්: අන්තිමට chat කරපු වෙලාව (නොකියවපු message තියෙනවා නම් රතු පාටින්) */}
                    {/* 👇 අලුත් message එකක් නම් "New message!", නැත්නම් ඒ කෙනා අන්තිමට සක්‍රිය වූ / login වූ වෙලාව */}
                    {(() => {
                      if (unreadCounts[user.id] > 0) return <span className="block truncate text-xs font-semibold text-red-500">{t.extra.newMessage}</span>;
                      // 🟢 Realtime: දැන් site එකේ ඉන්නවා නම් "දැන් online", tab එක වහපු ගමන් "සක්‍රිය වූයේ දැන්"
                      const isOnline = presence.online.has(user.id);
                      const lastActive = [user.last_seen_at, user.last_login_at, presence.leftAt.get(user.id)].filter(Boolean).sort().pop() ?? null;
                      const seen = isOnline
                        ? { online: true, text: t.profile.onlineNow }
                        : lastSeenText(null, lang, { onlineNow: t.profile.onlineNow, activeAgo: t.profile.activeAgo }, lastActive);
                      if (!seen) return null;
                      return (
                        <span className={`flex items-center gap-1.5 truncate text-xs ${seen.online ? "font-medium text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${seen.online ? "bg-green-500" : "bg-muted-foreground/40"}`} /> {seen.text}
                        </span>
                      );
                    })()}
                  </div>
                </button>
                {/* 🗑️ Chat එක සම්පූර්ණයෙන්ම ඉවත් කරන්න (confirm එකක් එක්ක) */}
                <button type="button" onClick={() => removeConversation(user)} aria-label={t.chat.removeChat} title={t.chat.removeChat} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground opacity-100 transition hover:bg-red-500/10 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 min-h-0 flex-col h-full bg-muted/10 ${activeUser ? 'flex' : 'hidden md:flex'}`}>
          {activeUser ? (
            <>
              <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border bg-background shadow-sm">
                <button onClick={() => setActiveUser(null)} className="md:hidden p-2 hover:bg-muted rounded-full cursor-pointer"><ArrowLeft className="h-5 w-5" /></button>
                {/* 👇 Photo / නම click කළාම සම්පූර්ණ profile එක */}
                <button type="button" onClick={() => setShowProfile(true)} className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 -m-1 text-left transition hover:bg-muted/50">
                  <AvatarImage src={activeUser.avatar_url} alt={activeUser.full_name} className="w-10 h-10" />
                  <h2 className="flex min-w-0 items-center gap-1.5 font-bold text-lg group-hover:text-primary transition-colors"><span className="truncate">{activeUser.full_name}</span>{activeUser.id_verified === "Yes" && <VerifiedBadge />}</h2>
                </button>
                {/* 👇 හැමවෙලේම පේන ⓘ button එක — විස්තර බලන්න පුළුවන් බව පැහැදිලියි */}
                <button
                  type="button"
                  onClick={() => setShowProfile(true)}
                  aria-label={t.profile.viewProfile}
                  title={t.profile.viewProfile}
                  className="ml-auto flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  <Info className="h-4 w-4" /> <span className="hidden sm:inline">{t.profile.details}</span>
                </button>
                {/* 👇 Block */}
                <button
                  type="button"
                  onClick={handleBlock}
                  aria-label={t.interests.block}
                  title={t.interests.block}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Ban className="h-4 w-4" /> <span className="hidden sm:inline">{t.interests.block}</span>
                </button>
              </div>


              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
                {messages.map((msg, index) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const isDeleted = msg.is_deleted;
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
                  const showAvatar = !isMe && !isSameSender;
                  const marginTop = isSameSender ? "mt-0.5" : "mt-4";
                  const timeString = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} ${marginTop}`}>
                      {!isMe && (
                        <div className="w-8 mr-2 shrink-0 flex items-start pt-1">
                          {showAvatar ? <AvatarImage src={activeUser.avatar_url} alt={activeUser.full_name} className="w-8 h-8" /> : <div className="w-8 h-8" />}
                        </div>
                      )}
                      <div className={`group flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                        <div className={`px-4 py-2 rounded-2xl ${isDeleted ? "bg-muted/50 border border-border text-muted-foreground italic text-xs" : isMe ? "bg-gradient-to-r from-[#E3324F] to-[#F0544F] text-white rounded-br-sm shadow-md" : "bg-background border border-border text-foreground rounded-bl-sm shadow-sm"}`}>
                          {/* 👇 ඡායාරූපයක් නම් ChatPhoto, හඬ පණිවිඩයක් නම් VoicePlayer, නැත්නම් text */}
                          {!isDeleted && msg.image_path
                            ? <ChatPhoto msg={msg} isMe={isMe} />
                            : !isDeleted && msg.audio_path
                              ? <VoicePlayer msgId={msg.id} duration={msg.audio_duration ?? 0} isMe={isMe} localUrl={msg._localAudio} />
                              : <p className={isDeleted ? "text-xs" : "text-[17px] leading-relaxed"}>{isDeleted ? "This message was deleted" : msg.content}</p>}
                        </div>
                        {!isDeleted && (
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {isMe && <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 cursor-pointer"><Trash2 className="h-3 w-3" /></button>}
                            <span className="text-[10px] text-muted-foreground">{timeString}</span>
                            {isMe && <span>{msg.is_read ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5 text-muted-foreground" />}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* 👇 ගෞරවයෙන් කතා කරන්න කියලා මතක් කිරීම — message type කරන තැනට උඩින් */}
              <div className="shrink-0 flex items-center gap-2.5 border-t border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p><span className="font-semibold text-foreground">{t.interests.chatSafetyTitle}:</span> {t.interests.chatSafetyMsg}</p>
              </div>
              {/* 👇 දකුණු පැත්තේ ඉඩ — 🎧 support බොත්තම (bottom-5 right-5) send button එක වහන්නේ නැති වෙන්න.
                  Screen එක ගොඩක් පළල නම් (chat එක 1600px එකෙන් නවතිනවා) ඒ ඉඩ ඕන නෑ. */}
              <form onSubmit={handleSend} className="shrink-0 p-4 pr-[5.5rem] min-[1760px]:pr-4 bg-background border-t border-border flex gap-2">
                {/* 👇 📷 ඡායාරූපයක් යවන්න + text (හඬ පණිවිඩයක් පටිගත කරනකොට හංගනවා) */}
                <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={pickPhoto} />
                {!voiceActive && (
                  <>
                    <button type="button" onClick={() => photoInputRef.current?.click()} aria-label={t.chat.attachPhoto} title={t.chat.attachPhoto} className="shrink-0 rounded-full border border-border p-3 text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                      <ImagePlus className="h-5 w-5" />
                    </button>
                    {/* 😊 Emoji — cursor එක තියෙන තැනට දානවා */}
                    <EmojiPicker onPick={insertEmoji} />
                    <input ref={messageInputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t.chat.typeMessage} className="min-w-0 flex-1 rounded-full border border-border bg-muted/50 px-6 py-3 outline-none focus:border-primary text-base" />
                  </>
                )}
                {/* 👇 🎤 හඬ පණිවිඩය — text එකක් type කරලා නැත්නම් / පටිගත කරනකොට */}
                {(voiceActive || !newMessage.trim()) && <VoiceRecorder onSend={sendVoice} onActiveChange={setVoiceActive} />}
                {!voiceActive && newMessage.trim() && (
                  <button type="submit" className="rounded-full bg-gradient-to-r from-[#E3324F] to-[#F0544F] p-3 text-white hover:opacity-90 cursor-pointer"><Send className="h-5 w-5" /></button>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MessageCircle className="h-16 w-16 mb-4 text-primary/20" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Your Messages</h2>
              <p className="max-w-xs">Select a conversation from the left side to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </main>
    {pendingPhoto && (
      <PhotoSendDialog
        file={pendingPhoto.file}
        previewUrl={pendingPhoto.url}
        onCancel={() => { URL.revokeObjectURL(pendingPhoto.url); setPendingPhoto(null); }}
        onSend={sendPhoto}
      />
    )}
    {/* Modal එක main එකෙන් එළියේ — navbar එකටත් උඩින් පේන්න */}
    {showProfile && activeUser && (
      <ProfileModal
        profile={{ ...activeUser, isBlurred: false, interestStatus: "accepted", photo_meta: photoMeta }}
        onClose={() => setShowProfile(false)}
        hideActions
        onBlocked={() => { setChatUsers((users) => users.filter((u) => u.id !== activeUser.id)); setActiveUser(null); }}
      />
    )}
    </>
  );
}

export default function ChatDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ChatDashboardContent />
    </Suspense>
  );
}