// components/ProfileModal.tsx
"use client";

import { 
  X, MapPin, User, GraduationCap, Briefcase, Heart, Ruler, Weight, Users, Star, 
  Utensils, Wine, Cigarette, Accessibility, Mail, Lock,
  Check, MessageCircle, Clock, Loader2, UserCheck, Quote, Ban, MoreVertical, Bookmark, Flag, Globe2, Info, UserRound
} from "lucide-react";
import { lastSeenText } from "@/lib/last-seen";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReportDialog from "@/components/ReportDialog";
import { useOnlineUsers } from "@/lib/presence";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import { useTr } from "@/components/OptionTranslations";
import HobbyIcon from "@/components/HobbyIcon";
import ProfileGallery from "@/components/ProfileGallery";
import MatchRing from "@/components/MatchRing";
import CanvasImage from "@/components/CanvasImage";
import { computeMatch } from "@/lib/match";
import { useMyProfile } from "@/lib/useMyProfile";
import { useBookmark } from "@/lib/bookmarks";
import VerifiedBadge from "@/components/VerifiedBadge";
import FoundingBadge from "@/components/FoundingBadge";
import MatchPhone from "@/components/MatchPhone";
import HoroscopeMatch from "@/components/HoroscopeMatch";
import HoroscopeSummary from "@/components/HoroscopeSummary";

// Send Interest එකේ ප්‍රතිඵලය (popup එක ඇතුළේම පෙන්නන්න)
export type SendInterestResult = { status: "sent" | "navigated" | "already" | "error"; message?: string };

export function ProfileModal({
  profile,
  onClose,
  onSendInterest,
  footer,
  hideActions = false,
  onBlocked,
  isPreview = false,


  adminView = false,
}: {
  profile: any;
  onClose: () => void;
  onSendInterest?: (id: string) => Promise<SendInterestResult | void> | void;
  /** Footer එකේ buttons වෙනස් කරන්න (උදා: Interests page එකේ Accept / Reject) */
  footer?: React.ReactNode;
  /** Footer එකේ buttons කිසිවක් එපා නම් (උදා: Chat page එකෙන් open කළාම) */
  hideActions?: boolean;
  /** Block කළාට පස්සේ (list එකෙන් අයින් කරන්න) */
  onBlocked?: (userId: string) => void;
  /** තමන්ගේම profile එකේ පෙරදසුන (block / match % නෑ) */
  isPreview?: boolean;
  /** Interest යැව්වාට පස්සේ පෙන්නන සමාන profiles */
  suggestions?: any[];
  onOpenProfile?: (p: any) => void;
  /** Admin dashboard එකෙන් open කළාම විතරයි — blur / lock නැතුව ඇත්ත photos (verify කරන්න) */
  adminView?: boolean;
}) {
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const me = useMyProfile(); // 👈 මගේ profile එක (match % එකට)
  const match = !isPreview && me && me.id !== profile?.id ? computeMatch(me, profile) : null;
  const [sendError, setSendError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLang();
  const tr = useTr(); // 👈 Values (Male, Hindu, Divorced...) තෝරපු language එකට
  const L = t.profile; // 👈 Labels (Gender, Religion...) තෝරපු language එකට
  // 👇 දැන් online නම් කොළ, නැත්නම් ඇත්ත අන්තිම login වෙලාව
  // 👇 දැන් online නම් කොළ, නැත්නම් "සක්‍රිය වූයේ X කට පෙර" (site එකේ අන්තිමට හිටපු / login වුණ වෙලාවෙන් අලුත්ම එක)
  const lastActive = [profile?.last_seen_at, profile?.last_login_at].filter(Boolean).sort().pop() ?? null;
  const presence = useOnlineUsers(); // 🟢 Realtime
  const seen = presence.online.has(profile?.id)
    ? { online: true, text: L.onlineNow }
    : lastSeenText(profile?.last_seen_at, lang, { onlineNow: L.onlineNow, activeAgo: L.activeAgo }, [lastActive, presence.leftAt.get(profile?.id)].filter(Boolean).sort().pop() ?? null);
  // "මා ගැන" — තෝරපු language එකෙන්, නැත්නම් තියෙන එකක්
  const about = profile?.[`about_me_${lang}`] || profile?.about_me_en || profile?.about_me_si || profile?.about_me_ta || "";
  const W = t.wizard;
  const { showConfirm, showAlert } = useDialog();
  const IT = t.interests;
  // 🚫 Block කරන්න පුළුවන් ගැලපුණු (match වුණු) අයට විතරයි
  const canBlock = !isPreview && !!me && me.id !== profile?.id && profile?.interestStatus === "accepted";
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const canAct = !isPreview && !!me && me.id !== profile?.id; // 👈 Bookmark / Report (තමන්ට නෙවෙයි)
  // 🔖 Bookmark — popup එක ආයේ open කළත් තත්ත්වය මතක තියෙනවා (lib/bookmarks.ts)
  const { bookmarked, toggle: toggleBookmarkRaw } = useBookmark(profile?.id, canAct);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const toggleBookmark = async () => {
    if (bookmarkBusy) return;
    setBookmarkBusy(true);
    const err = await toggleBookmarkRaw();
    setBookmarkBusy(false);
    // 👇 වැඩ කළේ නැත්නම් නිශ්ශබ්දව අයින් වෙන්නේ නැතුව හේතුව පෙන්නනවා (screenshot එකක් ගන්න පුළුවන්)
    if (err) showAlert({ title: t.extra.bookmark, message: `${t.extra.bookmarkError} (${err})`, tone: "error" });
  };
  // 🚫 Block — confirmation එකක් අහලා
  const block = async () => {
    const name = profile.full_name || "";
    const ok = await showConfirm({ title: IT.blockTitle.replace("{name}", name), message: IT.blockMsg, confirmText: IT.block, tone: "danger" });
    if (!ok) return;
    const res = await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: profile.id }) });
    if (!res.ok) return showAlert({ title: "Something went wrong", tone: "error" });
    onClose();
    onBlocked?.(profile.id);
    showAlert({ title: IT.blockDone.replace("{name}", name), tone: "success" });
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Photo lightbox / dialogs වගේ උඩින් තියෙන layers වල click කළොත් popup එක වහන්නේ නෑ
      if (target.closest?.("[data-modal-layer], [role='alertdialog']")) return;
      if (modalRef.current && !modalRef.current.contains(target)) onClose();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("[data-modal-layer]")) return; // Lightbox එක open නම් ඒක විතරයි වැහෙන්නේ
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!profile) return null;

  const hobbiesList = profile.hobbies ? profile.hobbies.split(',').map((h: string) => h.trim()) : [];

  const getHobbyIcon = (hobby: string) => <HobbyIcon hobby={hobby} className="h-4 w-4 mr-2" />;

  // 👇 Popup එක document.body එකට portal කරනවා — කොහේ ඉඳන් open කළත් navbar එකටත් උඩින් පේනවා
  return createPortal(
    // 📱 update-59: Phone එකේ පහළින් එන sheet එකක් (screen එකම වගේ), tablet / laptop එකේ මැද popup එක
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-md animate-modal-backdrop sm:items-center sm:p-4">
      {/* 👇 Popup එකේ විස්තර වල අකුරු ටිකක් ලොකු කරනවා (tablet / laptop එකේ විතරයි — phone එකේ හිරවෙන්නේ නැති වෙන්න) */}
      <style href="profile-modal-text" precedence="default">
        {`@media (min-width:640px){.profile-modal .text-sm{font-size:1rem;line-height:1.5rem}.profile-modal .text-xs{font-size:.875rem;line-height:1.25rem}}`}
      </style>
      <div ref={modalRef} className="profile-modal relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-background shadow-2xl animate-modal-content sm:max-h-[90vh] sm:rounded-[2rem]">

        {/* ✕ වහන්න — photo එක scroll වෙලා ගියත් හැමවිටම උඩ දකුණේ */}
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-40 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition hover:bg-black/80 active:scale-90 sm:right-4 sm:top-4">
          <X className="h-5 w-5" />
        </button>

        {/* 📜 Photo එකයි විස්තරයි එකට scroll වෙනවා — phone එකේ photo එක ඉඩ අල්ලගෙන හිරවෙන්නේ නෑ */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain">
        {/* Header Image */}
        <div className="relative h-[92vw] max-h-[440px] w-full shrink-0 overflow-hidden bg-muted sm:h-80">
          {/* 👇 Photo එක load වෙනකම් ඒකේම පොඩි blur version එක පිටිපස්සෙන් පේනවා */}
          {profile.avatar_placeholder && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_placeholder} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl" />
          )}
          {/* 👇 CSS Blur එක අයින් කළා */}
          {profile.avatar_url ? (
            // 🔒 canvas එකක (Inspect Element එකෙන් img link එකක් ගන්න බෑ)
            <CanvasImage src={profile.avatar_url} alt={profile.full_name} className="relative block w-full h-full" />
          ) : (
            <img 
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" 
              alt="Default" 
              className="w-full h-full object-cover opacity-80" 
            />
          )}

          {/* අගුල පෙන්නන තැන එහෙමම තියෙනවා */}
          {/* 👇 ගැලපීමේ ප්‍රතිශතය — photo එකේ පහළ දකුණු කෙළවරේ */}
          {match && (
            <div className="absolute bottom-4 right-4 z-20 origin-bottom-right scale-90 sm:bottom-5 sm:right-5 sm:scale-100">
              <MatchRing percent={match.percent} />
            </div>
          )}

          {/* 👇 Blur photo එක: ඇත්ත photo එක බලන්න ඔවුන් එක්ක සම්බන්ධ වෙන්න ඕන කියලා (interest තත්ත්වය අනුව) */}
          {profile.isBlurred && (
            // 👇 Photo එකේ (නමට උඩ තියෙන ඉඩේ) හරි මැදට — අගුලයි අකුරුයි එක card එකක, සමබරව
            <div className="absolute inset-x-0 top-0 bottom-32 z-10 flex items-center justify-center px-16">
              <div className="flex max-w-sm flex-col items-center gap-2.5 text-center [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md">
                  <Lock className="h-5 w-5 text-primary" />
                </span>
                <p className="text-sm font-medium leading-snug text-white">{L.lockedTitle}</p>
                {/* 👇 ඇරයුමක් යවලා / ලැබිලා නම් විතරයි අමතර පැහැදිලි කිරීම */}
                {(profile.interestStatus === "sent" || profile.interestStatus === "received") && (
                  <p className="text-xs leading-relaxed text-white/80">
                    {profile.interestStatus === "sent" ? L.lockedSent : L.lockedReceived}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
          
          {/* 👇 🔖 සුරකින්න + ⋮ menu (වාර්තා කරන්න / Block — block ගැලපුණු අයට විතරයි) */}
          {canAct && (
            <div className="absolute right-14 top-3 z-30 flex items-center gap-2 sm:right-16 sm:top-4">
              <button
                type="button"
                onClick={toggleBookmark}
                disabled={bookmarkBusy}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? t.extra.removeBookmark : t.extra.bookmark}
                title={bookmarked ? t.extra.removeBookmark : t.extra.bookmark}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold backdrop-blur-md transition active:scale-95 disabled:cursor-wait ${bookmarked ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-black/50 text-white hover:bg-black/80"}`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} /> <span className="hidden sm:inline">{bookmarked ? t.extra.bookmarked : t.extra.bookmark}</span>
              </button>
              {/* ⋮ menu (වාර්තා කරන්න / Block) — ගැලපුණු (match වුණු) අයට විතරයි */}
              {canBlock && <div className="relative">
                <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="More options" aria-expanded={menuOpen} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition backdrop-blur-md active:scale-90">
                  <MoreVertical className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <button type="button" onClick={() => { setMenuOpen(false); setReporting(true); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted">
                      <Flag className="h-4 w-4 text-amber-500" /> {t.extra.report}
                    </button>
                    <button type="button" onClick={() => { setMenuOpen(false); block(); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-500/10">
                      <Ban className="h-4 w-4" /> {IT.block}
                    </button>
                  </div>
                )}
              </div>}
            </div>
          )}

          <div className={`absolute inset-x-4 bottom-4 z-20 text-white sm:inset-x-6 sm:bottom-6 ${match ? "pr-24 sm:pr-32" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.full_name}</h2>
              {profile.id_verified === "Yes" && <VerifiedBadge variant="large" />}
              {profile.founding_member && <FoundingBadge variant="large" number={profile.founding_number} />}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/90 font-medium">
              <p className="flex items-center gap-1"><User className="h-4 w-4" /> {L.age.replace("{age}", String(profile.age ?? "-"))}, {tr(profile.gender)}</p>
              {/* 👇 නගරය (නැත්නම් දිස්ත්‍රික්කය) + රට */}
              <p className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {[profile.city || profile.district, profile.country].filter(Boolean).map((x: string) => tr(x)).join(", ")}</p>
            </div>
            {/* 👇 රැකියාව · උස · පැතිකඩ කළමනාකරණය කරන්නේ කවුද · අන්තිමට online */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold">
              {profile.job_title && <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm"><Briefcase className="h-3.5 w-3.5" /> {tr(profile.job_title)}</span>}
              {profile.height && <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm"><Ruler className="h-3.5 w-3.5" /> {profile.height}</span>}
              {profile.account_created_by && <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm"><UserCheck className="h-3.5 w-3.5" /> {L.managedBy.replace("{who}", String(tr(profile.account_created_by)))}</span>}
              {seen && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                  <span className={`h-2 w-2 rounded-full ${seen.online ? "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.6)] animate-pulse" : "bg-red-400"}`} /> {seen.text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-muted/20 p-4 sm:p-6">

          <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-3">
            <div className="rounded-2xl border border-border bg-background p-2.5 text-center shadow-sm sm:p-3">
              <p className="text-xs text-muted-foreground">{L.height}</p>
              <p className="font-bold text-lg text-primary flex items-center justify-center gap-1"><Ruler className="h-4 w-4"/>{profile.height || "-"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-2.5 text-center shadow-sm sm:p-3">
              <p className="text-xs text-muted-foreground">{L.weight}</p>
              <p className="font-bold text-lg text-primary flex items-center justify-center gap-1"><Weight className="h-4 w-4"/>{profile.weight || "-"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-2.5 text-center shadow-sm sm:p-3">
              <p className="text-xs text-muted-foreground">{L.status}</p>
              <p className="line-clamp-2 break-words text-sm font-bold leading-tight text-primary">{tr(profile.civil_status) || L.single}</p>
            </div>
          </div>

          {/* 👇 අමතර photos — accept කරපු අයට විතරයි, අනිත් අයට 🔒 */}
          <div className="mb-6 sm:mb-8">
            <ProfileGallery
              key={`${profile.id}-${profile.interestStatus}`} /* 👈 accept කළ ගමන් අලුතින් load වෙනවා (🔒 → photos) */
              userId={profile.id}
              mainPhoto={profile.isBlurred ? null : profile.avatar_url}
              initialMeta={adminView ? null : profile.photo_meta ?? (typeof profile.photo_count === "number" ? { locked: profile.interestStatus !== "accepted", count: profile.photo_count } : null)}
              adminView={adminView}
              initialPhotos={profile.preview_photos}
              eager={isPreview}
            />
          </div>

          {/* 📞 ගැලපුණු අයට — අංකය එක එක කෙනාට වෙන වෙනම (දෙපැත්තෙන්ම තමන් කැමති නම් විතරයි) */}
          {!isPreview && profile.interestStatus === "accepted" && me && me.id !== profile.id && <MatchPhone userId={profile.id} name={profile.full_name ?? ""} />}

          {/* 🔮 මගේ පැතිකඩ පෙරදසුනේ — කේන්දරය දාලා නම් සාරාංශය (අනිත් අයට පේන්නේ නෑ, ඔබට විතරයි) */}
          {isPreview && !adminView && <div className="mb-8"><HoroscopeSummary /></div>}

          {/* 💞 කේන්දර ගැළපීම — ගැලපුණු අයට ලකුණු · නැත්නම් "කේන්දරයක් දාලා තියෙනවා — accept කළාම පේනවා" විතරයි */}
          {!isPreview && !adminView && me && me.id !== profile.id && <HoroscopeMatch key={`h-${profile.id}-${profile.interestStatus}`} userId={profile.id} name={profile.full_name ?? ""} />}

          {/* 👇 මා ගැන */}
          {about && (
            <div className="mb-6 rounded-2xl border border-border bg-background p-4 shadow-sm sm:mb-8 sm:p-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground"><Quote className="h-4 w-4 text-primary" /> {L.aboutMe}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{about}</p>
            </div>
          )}

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-4 sm:space-y-6">
              <Section title={L.basicDetails}>
                <Detail icon={<User />} label={L.gender} value={tr(profile.gender)} />
                <Detail icon={<Star />} label={L.religion} value={tr(profile.religion)} />
                <Detail icon={<Star />} label={L.caste} value={tr(profile.caste)} />
                <Detail icon={<Star />} label={L.motherTongue} value={tr(profile.mother_tongue)} />
                <Detail icon={<Heart />} label={L.maritalStatus} value={tr(profile.civil_status)} />
              </Section>
              
              <Section title={L.careerEducation}>
                <Detail icon={<GraduationCap />} label={L.education} value={tr(profile.education)} />
                <Detail icon={<Briefcase />} label={L.profession} value={tr(profile.job_title)} />
                <Detail icon={<Briefcase />} label={L.income} value={tr(profile.income)} />
              </Section>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <Section title={L.familyDetails}>
                {/* 👇 පියා / මව එක ළඟ */}
                <ParentBlock
                  kind="father"
                  title={W.father}
                  rows={[
                    [W.ethnicity, tr(profile.father_ethnicity)], [L.religion, tr(profile.father_religion)], [L.caste, tr(profile.father_caste)],
                    [L.profession, tr(profile.father_job)], [W.additionalInfo, profile.father_info],
                  ]}
                />
                <ParentBlock
                  kind="mother"
                  title={W.mother}
                  rows={[
                    [W.ethnicity, tr(profile.mother_ethnicity)], [L.religion, tr(profile.mother_religion)], [L.caste, tr(profile.mother_caste)],
                    [L.profession, tr(profile.mother_job)], [W.additionalInfo, profile.mother_info],
                  ]}
                />
                <Detail icon={<Users />} label={L.siblings} value={profile.siblings} />
                <Detail icon={<Mail />} label={L.accountCreatedBy} value={tr(profile.account_created_by)} />
              </Section>

              <Section title={L.lifestyle}>
                <Detail icon={<Utensils />} label={L.food} value={tr(profile.food_preference)} />
                <Detail icon={<Wine />} label={L.drinking} value={tr(profile.drinking)} />
                <Detail icon={<Cigarette />} label={L.smoking} value={tr(profile.smoking)} />
                <Detail icon={<Accessibility />} label={L.differentlyAbled} value={tr(profile.differently_abled)} />
                <Detail icon={<Star />} label={W.horoscopeMatching} value={tr(profile.horoscope_matching)} />
              </Section>
            </div>
          </div>

          {hobbiesList.length > 0 && (
            <div className="mt-6 border-t border-border pt-5 sm:mt-8 sm:pt-6">
              <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">{L.hobbies}</h3>
              <div className="flex flex-wrap gap-2">
                {hobbiesList.map((hobby: string, i: number) => (
                  <span key={i} className="flex items-center px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
                    {getHobbyIcon(hobby)}
                    {tr(hobby)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        </div>{/* 👆 scroll කොටසේ අවසානය */}

        {!hideActions && <div className="border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          {footer ? footer : profile.interestStatus === "sent" ? (
            <div className="w-full py-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center">
              <span className="flex items-center gap-2 font-bold text-lg"><Clock className="h-5 w-5" /> {L.interestSent}</span>
              <span className="text-xs font-medium opacity-80">{L.pendingHint}</span>
            </div>
          ) : profile.interestStatus === "received" ? (
            <button onClick={() => { onSendInterest?.(profile.id); onClose(); }} className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white font-bold text-base sm:text-lg hover:opacity-90 shadow-lg shadow-primary/25 transition active:scale-[0.98] flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 fill-white" /> {L.likesYou} · {L.respond}
            </button>
          ) : profile.interestStatus === "accepted" ? (
            <button onClick={() => { onSendInterest?.(profile.id); onClose(); }} className="w-full py-3.5 sm:py-4 rounded-xl bg-green-600 text-white font-bold text-base sm:text-lg hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5" /> {L.chat}
            </button>
          ) : sendState === "sent" ? (
            // 👇 සාර්ථක වුණාම popup එක ඇතුළේම පෙන්නලා ටිකකින් වහනවා
            <div className="animate-in fade-in">
              <div role="status" className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 flex flex-col items-center justify-center">
                <span className="flex items-center gap-2 font-bold text-lg"><Check className="h-5 w-5" /> {t.browse.interestSentTitle}</span>
                <span className="text-xs font-medium opacity-90">{t.browse.interestSentMsg}</span>
              </div>
              {/* (update-31) පරණ "You might also like" කොටස අයින් කළා — දැන් Browse එකේ අලුත් popup එකක් (AfterSendDialog) */}
            </div>
          ) : (
            <>
              <button
                disabled={sendState === "sending"}
                onClick={async () => {
                  setSendState("sending");
                  setSendError(null);
                  const result = await onSendInterest?.(profile.id);
                  if (result && result.status === "sent") {
                    setSendState("sent");
                    // සමාන profiles තියෙනවා නම් popup එක වහන්නේ නෑ (ඒවා බලන්න), නැත්නම් ටිකකින් වහනවා
                    setTimeout(onClose, 1800);
                  } else if (result && result.status === "navigated") {
                    onClose();
                  } else {
                    setSendState("idle");
                    if (result?.message) setSendError(result.message);
                  }
                }}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white font-bold text-base sm:text-lg hover:opacity-90 shadow-lg shadow-primary/25 transition active:scale-[0.98] disabled:opacity-80 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                {sendState === "sending"
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> {L.sending}</>
                  : <><Heart className="h-5 w-5 fill-white" /> {L.sendInterest}</>}
              </button>
              {sendError && <p className="mt-2 text-center text-sm font-medium text-red-500">{sendError}</p>}
            </>
          )}
        </div>}
      </div>
      {reporting && <ReportDialog userId={profile.id} name={profile.full_name ?? ""} onClose={() => setReporting(false)} onBlock={canBlock ? block : undefined} />}
    </div>,
    document.body
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 border-b border-border pb-2 text-sm font-bold text-primary sm:mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 sm:gap-x-4 sm:gap-y-4">
        {children}
      </div>
    </div>
  );
}

// පියාගේ / මවගේ විස්තර (පුරවලා තියෙන ඒවා විතරයි පේන්නේ)
// 👇 පියා / මව — අනිත් විස්තර වගේම icons එක්ක (title එකටත් icon එකක්)
function ParentBlock({ title, rows, kind }: { title: string; rows: [string, string | number | null | undefined][]; kind: "father" | "mother" }) {
  const filled = rows.map((r) => ({ label: r[0], value: r[1] })).filter((r) => r.value !== null && r.value !== undefined && r.value !== "");
  if (filled.length === 0) return null;
  return (
    <div className="min-w-0">
      {/* 👇 Title එකත් අනිත් විස්තර වගේම සරල line icon එකකින් (ලොකු icon / border නෑ) */}
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
        <UserRound className="h-4 w-4 text-muted-foreground" /> {title}
      </p>
      <div className="space-y-3">
        {filled.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-3 pl-6">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold capitalize break-words">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 [&>svg]:w-4 [&>svg]:h-4 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        {/* 👇 දිග වචන පේළි දෙකකට කැඩෙනවා ("…" වෙලා හැංගෙන්නේ නෑ) */}
        <p className="text-sm font-semibold capitalize break-words">{value}</p>
      </div>
    </div>
  );
}