// components/navbar.tsx
"use client";

import { useLang } from "./providers";
import { useTheme } from "next-themes";
import { Moon, Sun, Globe, LogOut, User, Heart, MessageCircle, ChevronDown, ShieldAlert, LifeBuoy, BadgeCheck, HeartHandshake, Gift, Search, Sparkles, Star, Zap, Compass, Menu, X, House, Info, Crown, ShieldCheck, ChevronRight } from "lucide-react";
import { START_TOUR_EVENT } from "@/components/OnboardingTour";
import BoostProgress from "@/components/BoostProgress";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { languages } from "@/lib/i18n";
import { createClient } from "@/lib/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import VerifiedBadge from "@/components/VerifiedBadge";
import { setVerifiedHint } from "@/lib/verified-hint";
import { useHasMatch } from "@/lib/useHasMatch";
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
  // 📱 update-52: Phone / tablet (lg ට අඩු) — දකුණු පැත්තෙන් එන menu එක
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
  // 📱 Menu එක open වෙලා තියෙනකොට පිටුපස page එක scroll වෙන්නේ නෑ + Esc එකෙන් වහනවා
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMenuOpen(false); };
    const onResize = () => { if (window.innerWidth >= 1024) setIsMenuOpen(false); }; // 👈 laptop size වුණොත් වහනවා
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, [isMenuOpen]);
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
  const [verifiedBadge, setVerifiedBadge] = useState(false); // ✅ update-59: verify වෙලා නම් profile button එකේ ලකුණ
  const hasMatch = useHasMatch(user?.id ?? null) === true; // 💍 update-64: "කතාව බෙදාගන්න" ගැලපීමක් තියෙන අයට විතරයි
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
    if (!user?.id) {
      setIsVerified(true); setVerifiedBadge(false);
      if (authChecked) setVerifiedHint(null); // 👈 logout වුණාම මතක් කිරීම අයින් කරනවා
      return;
    }
    fetch("/api/admin/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => setIsAdmin(!!d?.role)).catch(() => {});
    const loadVerified = () => supabase.from("profiles").select("id_verified").eq("id", user.id).maybeSingle().then(({ data }) => {
      const v = data?.id_verified === "Yes";
      setIsVerified(v);
      setVerifiedBadge(v);           // ✅ update-59: profile button එකේ නිල් ✓ ලකුණ
      if (data) setVerifiedHint(v);  // 👈 Pricing වගේ pages වලට ඉක්මනින් දැනගන්න
    });
    loadVerified();
    window.addEventListener("profile-updated", loadVerified);
    return () => window.removeEventListener("profile-updated", loadVerified);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authChecked]);

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
    `relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors xl:px-3 ${
      isActive(href)
        ? "bg-primary/10 text-primary font-semibold"
        : "text-foreground/80 hover:text-primary hover:bg-muted/60"
    }`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const langLabel = (l: string) => (l === "si" ? "සිංහල" : l === "en" ? "English" : "தமிழ்");
  const hasUnread = hasUnreadMessages || hasUnreadInterests;
  const closeMenu = () => setIsMenuOpen(false);

  // 👇 Navbar එක page එකත් එක්ක scroll වෙනවා (fixed / sticky නෑ)
  return (
    <header ref={headerRef} className="relative z-[60] border-b border-border bg-background/95">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 lg:py-4">
        {/* 💗 Logo */}
        <Link href="/" aria-label={`${t.brand} – ${t.nav.home}`} className="flex shrink-0 items-center">
          <BrandLogo height={30} priority className="h-6 w-auto sm:h-[26px] xl:h-[30px]" />
        </Link>

        {/* 🖥️ Laptop / desktop (lg+) links — දැනට ඉන්න page එක රෝස පාටින් */}
        <div className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          <Link href="/" aria-current={isActive("/") ? "page" : undefined} className={navLinkClass("/")}>{t.nav.home}</Link>
          {/* 🔍 Browse — login නැති අයටත් */}
          {/* 💍 update-64: "යෝජනා සොයන්න" — රතු, තද අකුරු විතරයි (පසුබිමක් නෑ — click කරලා වගේ පේන්නේ නෑ) */}
          <Link data-tour="browse" href="/browse" aria-current={isActive("/browse") ? "page" : undefined} className={isActive("/browse") ? navLinkClass("/browse") : "relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/5 xl:px-3"}>
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
          <Link data-tour="pricing" href="/pricing" aria-current={isActive("/pricing") ? "page" : undefined} className={navLinkClass("/pricing")}>{t.plans.navLabel}</Link>
          <Link href="/about" aria-current={isActive("/about") ? "page" : undefined} className={navLinkClass("/about")}>{t.nav.about}</Link>
        </div>

        <div className="flex items-center gap-2">
          {/* 🔔 දැනුම්දීම් (login වෙලා නම් — phone / desktop දෙකේම) */}
          {user && <span data-tour="bell" className="inline-flex"><NotificationsBell userId={user.id} isAdmin={isAdmin} /></span>}

          {/* 🖥️ Desktop විතරයි: භාෂාව, theme, profile menu / login buttons */}
          <div className="hidden items-center gap-2 lg:flex">
            <span data-tour="lang" className="inline-flex">{/* 🧭 update-64: site guide එකේ ඉලක්කය */}
            <Dropdown
              value={lang}
              onChange={(v) => setLang(v as typeof lang)}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              ariaLabel={t.nav.language}
              align="right"
              buttonClassName="pl-3 pr-2.5"
              labelClassName="hidden xl:inline" // 👈 පොඩි laptop එකේ 🌐 icon එක විතරයි
              options={languages.map((l) => ({ value: l, label: langLabel(l) }))}
            />
            </span>
            {mounted && (
              <button data-tour="theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t.nav.darkMode} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition">
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            {user ? (
              <div data-tour="profile" className="relative ml-1 pl-3 border-l border-border" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setMenuPos({ top: r.bottom + 8, right: document.documentElement.clientWidth - r.right });
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  aria-expanded={isDropdownOpen}
                  className="flex items-center gap-2 rounded-xl border border-border pl-1 pr-2 py-1 hover:bg-muted transition group"
                >
                  <span className="relative">
                    <AvatarImage src={profile?.avatar_url} alt="Profile" shape="rounded-lg" className={`w-8 h-8 border transition-colors ${verifiedBadge ? "border-[#1D9BF0] ring-2 ring-[#1D9BF0]/25" : "border-border group-hover:border-primary"}`} />
                    {/* ✅ Verified නම් photo එකේ පහළ දකුණේ නිල් ලකුණ */}
                    {verifiedBadge && <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-background p-[1px] text-[13px] leading-none"><VerifiedBadge /></span>}
                  </span>
                  <span className="hidden max-w-[110px] truncate text-sm font-semibold xl:block">{profile?.full_name || t.nav.profile}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && menuPos && createPortal(
                  <div ref={menuRef} style={{ position: "fixed", top: menuPos.top, right: menuPos.right }} className="w-60 max-h-[calc(100dvh-90px)] overflow-y-auto rounded-xl border border-border bg-background shadow-xl py-1 z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                    <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/profile") ? "text-primary font-semibold bg-primary/5" : ""}`}><User className="h-4 w-4" /> <span>{t.nav.profile}</span></Link>
                    {/* ⚡ මගේ Boost එක (සක්‍රිය නම්) — ඉතුරු කාලය + progress */}
                    {myBoost && (
                      <Link href="/pricing" onClick={() => setIsDropdownOpen(false)} className="mx-3 my-2 block rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 transition hover:bg-amber-500/15">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300"><Zap className="h-3.5 w-3.5 fill-current" /> {t.boost.badge}</p>
                        <BoostProgress until={myBoost.until} startedAt={myBoost.startedAt} />
                      </Link>
                    )}
                    {/* 🧭 Site guide එක ආයේ බලන්න */}
                    <button type="button" onClick={() => { setIsDropdownOpen(false); window.dispatchEvent(new Event(START_TOUR_EVENT)); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"><Compass className="h-4 w-4" /> <span>{t.tour.menu}</span></button>
                    <Link href="/horoscope" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/horoscope") ? "text-primary font-semibold bg-primary/5" : ""}`}><Star className="h-4 w-4" /> <span>{t.horo.navLabel}</span></Link>
                    <Link href="/invite" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/invite") ? "text-primary font-semibold bg-primary/5" : ""}`}><Gift className="h-4 w-4" /> <span>{t.invite.navLabel}</span></Link>
                    {hasMatch && <Link href="/stories/new" onClick={() => setIsDropdownOpen(false)} className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${isActive("/stories/new") ? "text-primary font-semibold bg-primary/5" : ""}`}><Sparkles className="h-4 w-4" /> <span>{t.stories.navLabel}</span></Link>}
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
              // ⏳ Login ද නැද්ද කියලා බලනකම් — buttons පැනලා එන එක නවත්වන්න
              <div className="ml-1 flex items-center gap-2 pl-2" aria-hidden><div className="h-8 w-8 animate-pulse rounded-lg bg-muted" /><div className="h-4 w-20 animate-pulse rounded bg-muted" /></div>
            ) : (
              mounted && (
                <div className="ml-1 flex items-center gap-2">
                  <Link href="/login" className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition">{t.nav.login}</Link>
                  <Link href="/register" className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#DD2F4F] to-[#F05160] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 shadow-md shadow-primary/20 transition">{t.nav.register}</Link>
                </div>
              )
            )}
          </div>

          {/* 📱 Phone / tablet (lg ට අඩු): ☰ menu button එක (login නම් photo එකත් එක්ක) */}
          <div className="flex items-center gap-2 lg:hidden">
            {!user && authChecked && mounted && !isActive("/register") && (
              <Link href="/register" className="inline-flex whitespace-nowrap rounded-full bg-gradient-to-r from-[#DD2F4F] to-[#F05160] px-3.5 py-2 text-[13px] font-semibold text-white shadow-md shadow-primary/20 sm:px-4 sm:text-sm">{t.nav.register}</Link>
            )}
            <button
              type="button"
              data-tour="menu"
              onClick={() => setIsMenuOpen(true)}
              aria-label={t.nav.menu}
              aria-expanded={isMenuOpen}
              className={`relative flex h-10 items-center gap-1.5 rounded-full border border-border bg-background transition active:scale-95 ${user ? "pl-1 pr-2.5" : "w-10 justify-center"}`}
            >
              {user && (
                <span className="relative">
                  <AvatarImage src={profile?.avatar_url} alt="" shape="rounded-full" className={`h-8 w-8 border ${verifiedBadge ? "border-[#1D9BF0] ring-2 ring-[#1D9BF0]/25" : "border-border"}`} />
                  {verifiedBadge && <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-[1px] text-[12px] leading-none"><VerifiedBadge /></span>}
                </span>
              )}
              <Menu className="h-5 w-5" />
              {hasUnread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-red-500" aria-hidden />}
            </button>
          </div>
        </div>
      </nav>

      {/* 📱 Phone / tablet menu — දකුණු පැත්තෙන් slide වෙලා එන panel එක (document.body එකට portal) */}
      {mounted && createPortal(
        <div className={`fixed inset-0 z-[300] overflow-hidden lg:hidden ${isMenuOpen ? "" : "pointer-events-none"}`} aria-hidden={!isMenuOpen} inert={!isMenuOpen}>
          {/* පිටුපස අඳුරු කොටස — ඔබලා වහන්න */}
          <div onClick={closeMenu} className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            className={`absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,380px)] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Header: logo + වහන්න */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Link href="/" onClick={closeMenu} aria-label={t.nav.home}><BrandLogo height={24} className="h-6 w-auto" /></Link>
              <button type="button" onClick={closeMenu} aria-label={t.nav.closeMenu} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted active:scale-95"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              {/* 👤 Login වෙලා නම් — photo + නම */}
              {user && (
                <Link href="/profile" onClick={closeMenu} className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 transition hover:bg-muted">
                  <AvatarImage src={profile?.avatar_url} alt="" shape="rounded-full" className="h-12 w-12 border border-border" />
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-1.5 font-bold"><span className="truncate">{profile?.full_name || t.nav.profile}</span>{verifiedBadge && <VerifiedBadge />}</p>
                    <p className="text-sm text-primary">{t.nav.viewProfile}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {user && myBoost && (
                <Link href="/pricing" onClick={closeMenu} className="mb-3 block rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300"><Zap className="h-3.5 w-3.5 fill-current" /> {t.boost.badge}</p>
                  <BoostProgress until={myBoost.until} startedAt={myBoost.startedAt} />
                </Link>
              )}

              {/* 🧭 ප්‍රධාන pages */}
              <nav aria-label={t.nav.menu} className="space-y-0.5">
                <MenuRow href="/" active={isActive("/")} onNavigate={closeMenu} icon={House} label={t.nav.home} />
                <MenuRow href="/browse" active={isActive("/browse")} onNavigate={closeMenu} icon={Search} label={t.nav.browse} accent />
                {user && <MenuRow href="/interests" active={isActive("/interests")} onNavigate={closeMenu} icon={Heart} label={t.nav.interests} dot={hasUnreadInterests} />}
                {user && <MenuRow href="/chat" active={isActive("/chat")} onNavigate={closeMenu} icon={MessageCircle} label={t.nav.messages} dot={hasUnreadMessages} />}
                <MenuRow href="/pricing" active={isActive("/pricing")} onNavigate={closeMenu} icon={Crown} label={t.plans.navLabel} />
                <MenuRow href="/about" active={isActive("/about")} onNavigate={closeMenu} icon={Info} label={t.nav.about} />
              </nav>

              {/* 👤 මගේ ගිණුම */}
              {user ? (
                <>
                  <p className="mb-1 mt-5 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.nav.account}</p>
                  <div className="space-y-0.5">
                    {!isVerified && <MenuRow href="/verify" active={isActive("/verify")} onNavigate={closeMenu} icon={BadgeCheck} label={t.extra.getVerified} accent />}
                    <MenuRow href="/preferences" active={isActive("/preferences")} onNavigate={closeMenu} icon={HeartHandshake} label={t.prefs.navLabel} />
                    <MenuRow href="/horoscope" active={isActive("/horoscope")} onNavigate={closeMenu} icon={Star} label={t.horo.navLabel} />
                    <MenuRow href="/invite" active={isActive("/invite")} onNavigate={closeMenu} icon={Gift} label={t.invite.navLabel} />
                    {hasMatch && <MenuRow href="/stories/new" active={isActive("/stories/new")} onNavigate={closeMenu} icon={Sparkles} label={t.stories.navLabel} />}
                    <button type="button" onClick={() => { closeMenu(); window.dispatchEvent(new Event(START_TOUR_EVENT)); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] hover:bg-muted">
                      <Compass className="h-5 w-5 shrink-0" /><span className="flex-1">{t.tour.menu}</span><ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                    </button>
                    <MenuRow href="/help" active={isActive("/help")} onNavigate={closeMenu} icon={LifeBuoy} label={t.help.navLabel} />
                    {isAdmin && <MenuRow href="/admin" active={isActive("/admin")} onNavigate={closeMenu} icon={ShieldAlert} label="Admin Dashboard" accent />}
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <MenuRow href="/safety" active={isActive("/safety")} onNavigate={closeMenu} icon={ShieldCheck} label={t.safety.navLabel} />
                  <MenuRow href="/help" active={isActive("/help")} onNavigate={closeMenu} icon={LifeBuoy} label={t.help.navLabel} />
                </div>
              )}

              {/* ⚙️ සැකසුම්: භාෂාව + අඳුරු පෙනුම */}
              <p className="mb-2 mt-5 px-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.nav.settings}</p>
              <div className="space-y-2 px-1">
                <div role="radiogroup" aria-label={t.nav.language} className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
                  {languages.map((l) => (
                    <button
                      key={l}
                      type="button"
                      role="radio"
                      aria-checked={lang === l}
                      onClick={() => setLang(l)}
                      className={`min-h-10 rounded-lg text-sm font-semibold transition ${lang === l ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {langLabel(l)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={resolvedTheme === "dark"}
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-[15px] hover:bg-muted"
                >
                  {resolvedTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span className="flex-1 text-left">{t.nav.darkMode}</span>
                  <span className={`relative h-6 w-11 rounded-full transition-colors ${resolvedTheme === "dark" ? "bg-primary" : "bg-border"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${resolvedTheme === "dark" ? "left-[22px]" : "left-0.5"}`} />
                  </span>
                </button>
              </div>
            </div>

            {/* 👇 පහළ: Login / Register හෝ Logout */}
            <div className="border-t border-border p-3">
              {user ? (
                <button type="button" onClick={() => { closeMenu(); handleLogout(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-[15px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">
                  <LogOut className="h-5 w-5" /> {t.nav.logout}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={closeMenu} className="flex min-h-12 items-center justify-center rounded-xl border border-border text-[15px] font-semibold hover:bg-muted">{t.nav.login}</Link>
                  <Link href="/register" onClick={closeMenu} className="flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#DD2F4F] to-[#F05160] px-2 text-center text-[15px] font-semibold text-white shadow-md shadow-primary/20">{t.nav.register}</Link>
                </div>
              )}
            </div>
          </aside>
        </div>,
        document.body
      )}
    </header>
  );
}

// 📱 update-52: Phone menu එකේ එක පේළියක් (ලොකු, ඇඟිල්ලෙන් ඔබන්න ලේසි — අවම 48px උස)
function MenuRow({ href, icon: Icon, label, dot = false, accent = false, active, onNavigate }: {
  href: string; icon: typeof House; label: string; dot?: boolean; accent?: boolean; active: boolean; onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors active:scale-[0.99] ${
        active ? "bg-primary/10 font-semibold text-primary" : accent ? "font-semibold text-primary hover:bg-primary/5" : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {dot && <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
    </Link>
  );
}
