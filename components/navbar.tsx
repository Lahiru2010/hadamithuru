// components/navbar.tsx
"use client";

import { useLang } from "./providers";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe, LogOut, User, Heart, MessageCircle, ChevronDown, ShieldAlert, LifeBuoy, BadgeCheck, HeartHandshake, Gift, Search, Sparkles, Star, Zap, Compass } from "lucide-react";
import { START_TOUR_EVENT } from "@/components/OnboardingTour";
import BoostProgress from "@/components/BoostProgress";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { languages } from "@/lib/i18n";
import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { NavUser, NavProfile } from "@/lib/nav-profile";
import AvatarImage from "@/components/AvatarImage";
import Dropdown from "@/components/ui/Dropdown";
import NotificationsBell from "@/components/NotificationsBell";
import { joinPresence } from "@/lib/presence";
import { isAdminEmail } from "@/lib/admin-emails";
import { LAST_SEEN_INTERVAL_MS } from "@/lib/last-seen";


// 👇 initialUser / initialProfile එන්නේ server එකෙන් (app/layout.tsx).
//    ඒ නිසා navbar එක පෙන්නන ගමන්ම නම සහ photo එක තියෙනවා.
export function Navbar({ initialUser = null, initialProfile = null }: { initialUser?: NavUser | null; initialProfile?: NavProfile | null }) {
  const { t, lang, setLang } = useLang();
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(initialUser);
  const [authChecked, setAuthChecked] = useState(!!initialUser); // 👈 login ද කියලා දැනගන්නකම් skeleton එකක්
  
  const [profile, setProfile] = useState<any>(() => {
    if (initialProfile) return initialProfile;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false); 
  const [hasUnreadInterests, setHasUnreadInterests] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(isAdminEmail(initialUser?.email)); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // 👇 Profile menu එක document.body එකට portal කරලා fixed විදිහට — කිසිම page එකක (Messages ඇතුළුව) content එකකින් වැහෙන්නේ නෑ
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  // Page එක scroll කළාම / window එක resize කළාම menu එක වහනවා (navbar එකත් එක්ක එහෙමම තියෙන්න)
  useEffect(() => {
    if (!isDropdownOpen) return;
    const close = () => setIsDropdownOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close); window.removeEventListener("resize", close); };
  }, [isDropdownOpen]);
  const userRef = useRef<any>(initialUser); 
  const loadedForRef = useRef<string | null>(null); // 👈 කාගේ profile එකද දැනට load කරලා තියෙන්නේ
  // 👈 Server එකෙන් ආපු profile එක කාගේද (ඒකේ photo link එක ඉක්මන් නිසා ආයේ මාරු කරන්නේ නෑ)
  const serverProfileForRef = useRef<string | null>(initialProfile ? initialUser?.id ?? null : null);
  const pathnameRef = useRef(pathname);

  // 👇 "අන්තිමට online හිටියේ" — login වෙලා ඉන්නකොට විනාඩි 5කට සැරයක් update කරනවා
  useEffect(() => {
    if (!user?.id) return;
    const ping = () => {
      if (document.visibilityState !== "visible") return;
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id).then(() => {});
    };
    ping();
    const id = setInterval(ping, LAST_SEEN_INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", ping); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  const headerRef = useRef<HTMLElement>(null);
  const [isVerified, setIsVerified] = useState(true);
  // ⚡ මගේ boost එක සක්‍රියද (dropdown එකේ ඉතුරු කාලය පෙන්නන්න)
  const [myBoost, setMyBoost] = useState<{ until: string; startedAt: string | null } | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    fetch("/api/boost", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (active) setMyBoost(d?.boostedUntil && Date.parse(d.boostedUntil) > Date.now() ? { until: d.boostedUntil, startedAt: d.startedAt ?? null } : null);
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);
 // 👈 Verify වෙලා නැත්නම් විතරයි "තහවුරු වන්න" menu item එක

  // 🟢 Realtime online තත්ත්වය (Messages page එකේ අනිත් අයට ඒ ගමන්ම පේන්න)
  useEffect(() => { joinPresence(user?.id ?? null); }, [user?.id]);

  // 👇 Admin ද (database එකේ admins table එකෙන්) + verify වෙලාද
  useEffect(() => {
    if (!user?.id) { setIsVerified(true); return; }
    fetch("/api/admin/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setIsAdmin(!!d?.role)).catch(() => {});
    supabase.from("profiles").select("id_verified").eq("id", user.id).maybeSingle().then(({ data }) => setIsVerified(data?.id_verified === "Yes"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 👇 Navbar එකේ ඇත්ත උස CSS variable එකක් විදිහට (--nav-h) — Messages page එක screen එකට හරියටම ගැලපෙන්න
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--nav-h", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  useEffect(() => {
    setMounted(true);

    // 👇 Unread messages ගණන් කරන්නේ Messages page එකේ පේන අයගෙන් (interest එක accept කරපු අයගෙන්) විතරයි.
    //    Interest එක remove කරපු අයගෙන් කලින් ආපු messages Messages page එකේ පේන්නේ නැති නිසා
    //    ඒවා කවදාවත් "read" වෙන්නේ නෑ — ඒවා ගණන් ගත්තොත් රතු තිත හැමවෙලේම පේනවා.
    const countUnreadMessages = async (userId: string) => {
      const { data: accepted } = await supabase
        .from("interests")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const partnerIds = Array.from(
        new Set((accepted || []).map((i) => (i.sender_id === userId ? i.receiver_id : i.sender_id)))
      );
      if (partnerIds.length === 0) return 0;

      const { count } = await supabase
        .from("messages")
        .select("id", { count: 'exact', head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .in("sender_id", partnerIds);
      return count || 0;
    };

    // 👇 User ගේ නම, photo එක සහ notifications load කරනවා.
    //    Page එක මුලින්ම open කරනකොටත්, අලුතින් login වුණාමත් මේක call වෙනවා.
    const loadUserData = async (userId: string) => {
      if (loadedForRef.current === userId) return; // එකම user ට දෙපාරක් load කරන්නේ නෑ
      loadedForRef.current = userId;

      const [profileRes, unreadCount, intRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).single(),
        countUnreadMessages(userId),
        supabase.from("interests").select("*", { count: 'exact', head: true }).eq("receiver_id", userId).eq("status", "pending").eq("is_seen", false)
      ]);

      if (profileRes.data) {
        // 👇 Photo එක /api/avatar/... එකෙන් (ඒක signed link එකකට redirect කරනවා)
        const p = { full_name: profileRes.data.full_name, avatar_url: profileRes.data.avatar_url ? `/api/avatar/${userId}` : null };
        if (serverProfileForRef.current !== userId) setProfile(p);
        localStorage.setItem('cached_profile', JSON.stringify(p)); 
      } else {
        loadedForRef.current = null; // Profile එක තාම නැත්නම් (අලුත් account) පස්සේ ආයේ try කරනවා
      }
      setHasUnreadMessages(unreadCount > 0);
      setHasUnreadInterests((intRes.count || 0) > 0);
      window.dispatchEvent(new CustomEvent("seneha-unread", { detail: unreadCount })); // 🔔 favicon badge
    };

    const checkUser = async () => {
      // ⚡ getSession — browser එකේ තියෙන session එක (Supabase server එකට යන්නේ නෑ → ක්ෂණිකයි).
      //    UI එක පෙන්නන්න විතරයි; දත්ත ආරක්ෂාව server / RLS එකෙන්.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setUser(user);
      userRef.current = user;
      setAuthChecked(true);

      if (user) {
        setIsAdmin(isAdminEmail(user.email));
        loadUserData(user.id);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      userRef.current = sessionUser; 
      if (!sessionUser) {
        loadedForRef.current = null;
        serverProfileForRef.current = null;
        setProfile(null);
        localStorage.removeItem('cached_profile'); 
        setHasUnreadMessages(false); 
        setHasUnreadInterests(false); 
        window.dispatchEvent(new CustomEvent("seneha-unread", { detail: 0 })); 
        setIsAdmin(false);
      } else {
        setIsAdmin(isAdminEmail(sessionUser.email));
        // 👇 අලුතින් login වුණාම නම සහ photo එක load කරනවා.
        //    (Supabase එකේ නිර්දේශය අනුව auth callback එක ඇතුළේ කෙලින්ම query කරන්නේ නැතුව setTimeout එකකින්)
        setTimeout(() => loadUserData(sessionUser.id), 0);
      }
    });

    const handleRefreshMessages = async () => { 
      if (userRef.current?.id) {
        const unreadCount = await countUnreadMessages(userRef.current.id);
        setHasUnreadMessages(unreadCount > 0);
        window.dispatchEvent(new CustomEvent("seneha-unread", { detail: unreadCount })); // 🔔 favicon badge
      }
    };
    // 🔔 Favicon එකට විතරක් ගණන (Messages page එකේ ඉන්නකොටත් — navbar තිත වෙනස් නොකර)
    const refreshFaviconOnly = async () => {
      if (!userRef.current?.id) return;
      const unreadCount = await countUnreadMessages(userRef.current.id);
      window.dispatchEvent(new CustomEvent("seneha-unread", { detail: unreadCount }));
    };
    const handleRefreshInterests = async () => { 
      if (userRef.current?.id) {
        const { count } = await supabase.from("interests").select("*", { count: 'exact', head: true }).eq("receiver_id", userRef.current.id).eq("status", "pending").eq("is_seen", false);
        setHasUnreadInterests((count || 0) > 0);
      }
    };
    
    // 👇 Profile photo එක වෙනස් වුණාම (My Profile page එකෙන්) navbar එකේ photo එකත් අලුත් කරනවා
    const handleAvatarUpdated = async () => {
      if (!userRef.current?.id) return;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", userRef.current.id).single();
      if (data) {
        setProfile(data);
        localStorage.setItem('cached_profile', JSON.stringify(data));
      }
    };

    window.addEventListener('refresh_unread_status', handleRefreshMessages);
    window.addEventListener('refresh_interests_status', handleRefreshInterests);
    window.addEventListener('avatar-updated', handleAvatarUpdated);

    // 👇 මේකෙ අන්තිමට Date.now() දාලා තියෙනවා. ඒකෙන් එකම නමින් දෙපාරක් හැදෙන එක නවත්තනවා
    const channel = supabase.channel(`navbar_notifications_${userRef.current?.id || 'guest'}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // 👇 අලුත් message එකක් ආවම කෙලින්ම තිත දාන්නේ නැතුව, ගණන ආයේ බලනවා
        if (payload.new.receiver_id === userRef.current?.id && pathnameRef.current !== '/chat') handleRefreshMessages();
        // 👇 Messages page එකේ ඉන්නකොට: chat එක කියවපු ලෙස mark වෙන්න පොඩි වෙලාවක් දීලා favicon එක update කරනවා
        else if (payload.new.receiver_id === userRef.current?.id) setTimeout(refreshFaviconOnly, 1500);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'interests' }, (payload) => {
        if (payload.new.receiver_id === userRef.current?.id && pathnameRef.current !== '/interests') setHasUnreadInterests(true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.receiver_id === userRef.current?.id) handleRefreshMessages();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'interests' }, (payload) => {
        if (payload.new.receiver_id === userRef.current?.id || payload.new.sender_id === userRef.current?.id) {
          handleRefreshInterests();
          handleRefreshMessages(); // 👈 Interest එකක් accept/remove වුණාම messages තිතත් ආයේ බලනවා
        }
      })
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && !menuRef.current?.contains(target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('refresh_unread_status', handleRefreshMessages);
      window.removeEventListener('refresh_interests_status', handleRefreshInterests);
      window.removeEventListener('avatar-updated', handleAvatarUpdated);
    };
  }, []);

  // 👇 දැනට ඉන්න page එක හොයාගන්නවා ("/" එකට හරියටම, අනිත් ඒවාට ඒ path එකෙන් පටන් ගන්නවා නම්)
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const navLinkClass = (href: string) =>
    `relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-primary/10 text-primary font-semibold"
        : "text-foreground/80 hover:text-primary hover:bg-muted/60"
    }`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // 👇 Navbar එක page එකත් එක්ක scroll වෙනවා (fixed / sticky නෑ)
  return (
    <header ref={headerRef} className="relative z-[60] border-b border-border bg-background/95">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-primary">{t.brand}</Link>
        {/* 👇 දැනට ඉන්න page එකේ link එක රෝස පාට පසුබිමකින් highlight වෙනවා */}
        <div className="hidden gap-1 md:flex">
          <Link href="/" aria-current={isActive("/") ? "page" : undefined} className={navLinkClass("/")}>{t.nav.home}</Link>
          {/* 🔍 Browse — login නැති අයටත් */}
          <Link data-tour="browse" href="/browse" aria-current={isActive("/browse") ? "page" : undefined} className={navLinkClass("/browse")}>
            <Search className={`h-4 w-4 ${isActive("/browse") ? "stroke-[2.5]" : ""}`} /> {t.nav.browse}
          </Link>
          {user && (
            <>
              <Link data-tour="interests" href="/interests" aria-current={isActive("/interests") ? "page" : undefined} className={navLinkClass("/interests")}>
                <Heart className={`h-4 w-4 ${isActive("/interests") ? "fill-current" : ""}`} /> {t.nav.interests}
                {hasUnreadInterests && <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
              </Link>
              <Link data-tour="messages" href="/chat" aria-current={isActive("/chat") ? "page" : undefined} className={navLinkClass("/chat")}>
                <MessageCircle className={`h-4 w-4 ${isActive("/chat") ? "fill-current" : ""}`} /> {t.nav.messages}
                {hasUnreadMessages && <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
              </Link>
            </>
          )}
          <Link href="/pricing" aria-current={isActive("/pricing") ? "page" : undefined} className={navLinkClass("/pricing")}>{t.plans.navLabel}</Link>
          <Link href="/about" aria-current={isActive("/about") ? "page" : undefined} className={navLinkClass("/about")}>{t.nav.about}</Link>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔔 දැනුම්දීම් (login වෙලා නම්) */}
          {user && <span data-tour="bell" className="inline-flex"><NotificationsBell userId={user.id} isAdmin={isAdmin} /></span>}
          {/* 👇 Language — site එකට ගැලපෙන dropdown එක, භාෂාවල නම් ඒ ඒ අකුරෙන්ම */}
          <Dropdown
            value={lang}
            onChange={(v) => setLang(v as typeof lang)}
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            ariaLabel="Language"
            align="right"
            buttonClassName="pl-3 pr-2.5"
            options={languages.map((l) => ({ value: l, label: l === "si" ? "සිංහල" : l === "en" ? "English" : "தமிழ்" }))}
          />
          {mounted && (
            <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition">
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          {user ? (
            <div data-tour="profile" className="relative ml-2 pl-2 border-l border-border" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setMenuPos({ top: r.bottom + 8, right: document.documentElement.clientWidth - r.right });
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-2 rounded-xl border border-border pl-1 pr-2 py-1 hover:bg-muted transition group"
              >
                <AvatarImage src={profile?.avatar_url} alt="Profile" shape="rounded-lg" className="w-8 h-8 border border-border group-hover:border-primary transition-colors" />
                <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">{profile?.full_name || t.nav.profile}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && menuPos && createPortal(
                <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, right: menuPos.right }} className="w-52 rounded-xl border border-border bg-background shadow-xl py-1 z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/profile") ? "text-primary font-semibold bg-primary/5" : ""}`}><User className="h-4 w-4" /> <span>My Profile</span></Link>
                  <Link href="/interests" onClick={() => setIsDropdownOpen(false)} className={`flex md:hidden items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/interests") ? "text-primary font-semibold bg-primary/5" : ""}`}><div className="flex items-center gap-2"><Heart className="h-4 w-4" /><span>{t.nav.interests}</span></div>{hasUnreadInterests && <span className="h-2 w-2 rounded-full bg-red-500"></span>}</Link>
                  <Link href="/chat" onClick={() => setIsDropdownOpen(false)} className={`flex md:hidden items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/chat") ? "text-primary font-semibold bg-primary/5" : ""}`}><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /><span>{t.nav.messages}</span></div>{hasUnreadMessages && <span className="h-2 w-2 rounded-full bg-red-500"></span>}</Link>
                  {/* 👇 තහවුරු වන්න + උදව් */}
                  {/* ⚡ මගේ Boost එක (සක්‍රිය නම්) — ඉතුරු කාලය + progress */}
                  {myBoost && (
                    <Link href="/pricing" onClick={() => setIsDropdownOpen(false)} className="mx-3 my-2 block rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 transition hover:bg-amber-500/15">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300"><Zap className="h-3.5 w-3.5 fill-current" /> {t.boost.badge}</p>
                      <BoostProgress until={myBoost.until} startedAt={myBoost.startedAt} />
                    </Link>
                  )}
                  {/* 🧭 Site guide එක ආයේ බලන්න */}
                  <button type="button" onClick={() => { setIsDropdownOpen(false); window.dispatchEvent(new Event(START_TOUR_EVENT)); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"><Compass className="h-4 w-4" /> <span>{t.tour.menu}</span></button>
                  {/* 🔮 මගේ කේන්දරය */}
                  <Link href="/horoscope" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/horoscope") ? "text-primary font-semibold bg-primary/5" : ""}`}><Star className="h-4 w-4" /> <span>{t.horo.navLabel}</span></Link>
                  {/* 🎁 යාළුවන්ට ආරාධනා */}
                  <Link href="/invite" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/invite") ? "text-primary font-semibold bg-primary/5" : ""}`}><Gift className="h-4 w-4" /> <span>{t.invite.navLabel}</span></Link>
                  {/* 💍 අපේ කතාව බෙදාගන්න (තෑග්ගක් එක්ක) */}
                  <Link href="/stories/new" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/stories/new") ? "text-primary font-semibold bg-primary/5" : ""}`}><Sparkles className="h-4 w-4" /> <span>{t.stories.navLabel}</span></Link>
                  {/* 💞 මම කැමති සහකරු */}
                  <Link href="/preferences" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/preferences") ? "text-primary font-semibold bg-primary/5" : ""}`}><HeartHandshake className="h-4 w-4" /> <span>{t.prefs.navLabel}</span></Link>
                  {!isVerified && <Link href="/verify" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/verify") ? "text-primary font-semibold bg-primary/5" : ""}`}><BadgeCheck className="h-4 w-4" /> <span>{t.extra.getVerified}</span></Link>}
                  <Link href="/help" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/help") ? "text-primary font-semibold bg-primary/5" : ""}`}><LifeBuoy className="h-4 w-4" /> <span>{t.help.navLabel}</span></Link>
                  {isAdmin && <Link href="/admin" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm text-primary font-semibold hover:bg-primary/10 transition-colors ${isActive("/admin") ? "bg-primary/10" : ""}`}><ShieldAlert className="h-4 w-4" /> <span>Admin Dashboard</span></Link>}
                  <div className="h-px bg-border my-1" />
                  <button onClick={() => { setIsDropdownOpen(false); handleLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><LogOut className="h-4 w-4" /> <span>{t.nav.logout}</span></button>
                </div>,
                document.body
              )}
            </div>
          ) : !authChecked ? (
            // ⏳ Login ද නැද්ද කියලා බලනකම් (මිලි තත්පර කීපයක්) — buttons පැනලා එන එක නවත්වන්න
            <div className="ml-2 flex items-center gap-2 pl-2" aria-hidden><div className="h-8 w-8 animate-pulse rounded-lg bg-muted" /><div className="hidden h-4 w-20 animate-pulse rounded bg-muted sm:block" /></div>
          ) : (
            mounted && (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium hover:bg-muted sm:block transition">{t.nav.login}</Link>
                <Link href="/register" className="rounded-full bg-gradient-to-r from-[#E3324F] to-[#F0544F] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-md shadow-primary/20 transition">{t.nav.register}</Link>
              </div>
            )
          )}
        </div>
      </nav>
    </header>
  );
}