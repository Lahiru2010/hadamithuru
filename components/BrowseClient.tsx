// components/BrowseClient.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/client"; 
import { useRouter } from "next/navigation";
import { MapPin, User, Heart, SlidersHorizontal, Loader2, ChevronDown, Check, X, MessageCircle, Clock } from "lucide-react"; 
import { ProfileModal, type SendInterestResult } from "@/components/ProfileModal";
import CardImage from "@/components/CardImage";
import SavedFilters, { type FilterValues } from "@/components/SavedFilters";
import { useDialog } from "@/components/DialogProvider";
import { useLang } from "@/components/providers";
import { useTr } from "@/components/OptionTranslations";
import Dropdown from "@/components/ui/Dropdown";
import { ArrowUpDown, Mars, Venus, Users, Cake, BadgeCheck, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import { FOUNDING_LIMIT, FOUNDING_MONTHS, OFFER_ACTIVE, useFoundingSpotsLeft } from "@/lib/offer";
import FoundingBadge from "@/components/FoundingBadge";
import AfterSendDialog from "@/components/AfterSendDialog";
import { computeMatch, type MatchResult } from "@/lib/match";
import MiniMatchRing from "@/components/MiniMatchRing";
import { interestQuota, isLimitError } from "@/lib/interest-limit";
import { track } from "@/lib/analytics";

const PAGE_FIRST = 20;
const PAGE_MORE = 15;


// 👇 මේ user එක්ක මගේ interest එකේ තත්ත්වය
export type InterestStatus = "none" | "sent" | "received" | "accepted";

type Profile = {
  id: string; full_name: string; age: number; gender: string; country: string; avatar_url: string;
  civil_status?: string; religion?: string; caste?: string; mother_tongue?: string; height?: string;
  weight?: string; education?: string; job_title?: string; income?: string; city?: string; district?: string;
  father_job?: string; mother_job?: string; siblings?: number; horoscope?: string; hobbies?: string;
  food_preference?: string; drinking?: string; smoking?: string; differently_abled?: string; account_created_by?: string; id_verified?: string; founding_member?: boolean; founding_number?: number | null; boosted_until?: string | null;
  created_at?: string; blur_photo?: boolean; avatar_placeholder?: string | null;
};

const MIN_AGE = 18;
const MAX_AGE = 60;

const DISTRICT_LIST = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", 
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", 
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", 
  "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", 
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const EDUCATION_LIST = [
  "O/L", "A/L", "Diploma", "B.Sc", "B.A", "BBA", "M.Sc", "MBA", "PhD", "Other"
];

const COUNTRY_LIST = [
  "Australia", "Canada", "Italy", "Japan", "Maldives", "New Zealand",
  "Singapore", "South Korea", "Sri Lanka", "United Arab Emirates",
  "United Kingdom", "United States", "Other"
];

const CASTE_LIST = [
  "Govigama", "Karava", "Durava", "Nawandawa", "Salagama", "Vahumpura", "Other"
];

const MARITAL_STATUS_LIST = ["Never Married", "Divorced", "Widowed"];
const RELIGION_LIST = ["Buddhist", "Hindu", "Christian", "Islam", "Other"];

const PROFESSION_LIST = [
  "Accountant", "Architect", "Banker", "Business Owner", "Chef", "Civil Engineer",
  "Doctor", "Driver", "Engineer", "Executive", "Farmer", "Government Service",
  "Graphic Designer", "HR Professional", "Hotelier", "IT Professional", "Lawyer",
  "Lecturer", "Manager", "Medical Professional", "Military", "Not Employed",
  "Nurse", "Police Officer", "Quantity Surveyor", "Researcher", "Sales Executive",
  "Self Employed", "Software Engineer", "Student", "Supervisor", "Surveyor",
  "Teacher", "Technician", "Other"
];

const getCountryFlag = (country: string) => {
  if (!country) return "🌍";
  const c = country.toLowerCase();
  if (c.includes("sri lanka")) return "🇱🇰";
  if (c.includes("uk") || c.includes("united kingdom")) return "🇬🇧";
  if (c.includes("australia")) return "🇦🇺";
  if (c.includes("canada")) return "🇨🇦";
  if (c.includes("dubai") || c.includes("uae") || c.includes("united arab")) return "🇦🇪";
  if (c.includes("singapore")) return "🇸🇬";
  if (c.includes("usa") || c.includes("united states")) return "🇺🇸";
  if (c.includes("india")) return "🇮🇳";
  if (c.includes("italy")) return "🇮🇹";
  if (c.includes("japan")) return "🇯🇵";
  if (c.includes("maldives")) return "🇲🇻";
  if (c.includes("new zealand")) return "🇳🇿";
  if (c.includes("south korea")) return "🇰🇷";
  return "🌍";
};

const getHeightInInches = (heightStr?: string) => {
  if (!heightStr) return 0;
  const match = heightStr.match(/(\d+)'\s*(\d+)/);
  if (match) return parseInt(match[1]) * 12 + parseInt(match[2]);
  const cmMatch = heightStr.match(/(\d+)/);
  if (cmMatch) return parseInt(cmMatch[1]);
  return 0;
};

const CustomCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <label className="flex items-center gap-3 cursor-pointer group mb-3 last:mb-0">
    <div className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary' : 'border-border bg-background group-hover:border-primary/50'}`}>
      {checked && <Check className="h-3.5 w-3.5 text-white" />}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <span className="text-sm font-medium text-foreground">{label}</span>
  </label>
);

const AgeSlider = React.memo(({ initialMin, initialMax, onApply }: { initialMin: string, initialMax: string, onApply: (min: string, max: string) => void }) => {
  const { t } = useLang();
  const [localMin, setLocalMin] = useState(initialMin);
  const [localMax, setLocalMax] = useState(initialMax);

  useEffect(() => { setLocalMin(initialMin); setLocalMax(initialMax); }, [initialMin, initialMax]);

  const minPercent = ((parseInt(localMin) - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;
  const maxPercent = ((parseInt(localMax) - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold">{t.browse.ageRange}</label>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{localMin} - {localMax} {t.browse.yrs}</span>
      </div>
      <div className="relative w-full h-5 flex items-center group">
        <div className="absolute w-full h-1.5 bg-muted rounded-full"></div>
        <div className="absolute h-1.5 bg-primary rounded-full pointer-events-none" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}></div>
        <input type="range" min={MIN_AGE} max={MAX_AGE} value={localMin} onChange={(e) => setLocalMin(Math.min(Number(e.target.value), Number(localMax) - 1).toString())} onPointerUp={() => onApply(localMin, localMax)} onTouchEnd={() => onApply(localMin, localMax)} className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110" />
        <input type="range" min={MIN_AGE} max={MAX_AGE} value={localMax} onChange={(e) => setLocalMax(Math.max(Number(e.target.value), Number(localMin) + 1).toString())} onPointerUp={() => onApply(localMin, localMax)} onTouchEnd={() => onApply(localMin, localMax)} className="absolute w-full appearance-none bg-transparent pointer-events-none z-30 focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110" />
      </div>
    </div>
  );
});
AgeSlider.displayName = "AgeSlider";

const AccordionSection = ({ title, children, isOpen, onToggle, hasActiveFilters }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void, hasActiveFilters?: boolean }) => (
  <div className="border-b border-border/50 py-3 last:border-0">
    <button onClick={onToggle} className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer group">
      <div className="flex items-center gap-2">
        <span className="tracking-wide group-hover:text-primary transition-colors">{title}</span>
        {hasActiveFilters && <span className="flex h-2 w-2 rounded-full bg-primary animate-in zoom-in duration-300"></span>}
      </div>
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
      <div className="pl-1">{children}</div>
    </div>
  </div>
);

// ⚡ Boost / 💎 Premium තවම සක්‍රියද (දිනයක් අනාගතයේද)
function isBoosted(until?: string | null) {
  return !!until && Date.parse(until) > Date.now();
}

const ProfileGrid = React.memo(({ profiles, visibleCount, onSelectProfile, handleSendInterest, acceptedUserIds, getInterestStatus, matches, promo, promoAt = 10 }: any) => {
  const { t } = useLang();
  const tr = useTr();
  const shown = profiles.slice(0, visibleCount);
  return (
    // 👇 grid-flow-dense — "තහවුරු කරගන්න" tile එක (tiles දෙකක පළල) පේළියක අගට නොගැලපුණොත්, ඊළඟ profiles වලින් හිස් තැන පුරවනවා
    <div className="grid grid-flow-row-dense grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
      {/* 👇 ✅ "ගිණුම තහවුරු කරගන්න" tile එක — tiles දෙකක් පළලට, ටිකක් scroll කළාට පස්සේ (promoAt=10 වෙනි තැනට). Profiles අඩු නම් අන්තිමට */}
      {shown.length <= promoAt && promo}
      {shown.map((profile: Profile, index: number) => {
        const isBlurred = profile.blur_photo === true && !acceptedUserIds.includes(profile.id);
        const interestStatus: InterestStatus = getInterestStatus(profile.id);
        const match: MatchResult = matches?.get(profile.id) ?? null;

        return (
        <React.Fragment key={profile.id}>
        {index === promoAt && promo}
        <div onClick={() => onSelectProfile({ ...profile, isBlurred, interestStatus })} className={`group relative overflow-hidden rounded-2xl bg-background border shadow-sm ${isBoosted(profile.boosted_until) ? "border-amber-400 ring-2 ring-amber-300/50" : "border-border"}  transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer`}>
          
          <div className="relative h-48 w-full overflow-hidden bg-muted shrink-0">
            {/* 👇 Loading animation එකත් එක්ක photo එක (පළවෙනි cards 6 ඉක්මනින්ම load වෙනවා) */}
            <CardImage key={profile.avatar_url} src={profile.avatar_url} placeholder={profile.avatar_placeholder} alt={profile.full_name} priority={index < 6} />

            {/* 👇 Admin තහවුරු කළ අයට: photo එකේ පහළ වම් කෙළවරේ "✓ තහවුරුයි" */}
            {/* 👇 ✅ තහවුරුයි + 👑 ආරම්භක සාමාජික (photo එකේ පහළ වම් කෙළවරේ) */}
            {(profile.id_verified === "Yes" || profile.founding_member) && (
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1">
                {profile.id_verified === "Yes" && <VerifiedBadge variant="pill" />}
                {profile.founding_member && <FoundingBadge variant="icon" number={profile.founding_number} />}
              </div>
            )}

            {/* ⚡ Boost කරපු අයට "විශේෂිත" ලකුණ + රන්වන් border එකක් */}
            {isBoosted(profile.boosted_until) && interestStatus === "none" && (
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow-md">
                <Zap className="h-3 w-3 fill-current" /> {t.boost.badge}
              </div>
            )}
            {/* 👇 Interest තත්ත්වය photo එකේ උඩ වම් කෙළවරේ පොඩි badge එකකින් */}
            {interestStatus === "sent" && (
              <div title={t.profile.pendingHint} className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                <Clock className="h-3 w-3" /> {t.profile.pending}
              </div>
            )}
            {interestStatus === "received" && (
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                <Heart className="h-3 w-3 fill-current" /> {t.profile.likesYou}
              </div>
            )}
            {interestStatus === "accepted" && (
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                <Check className="h-3 w-3" /> {t.profile.matched}
              </div>
            )}
            
            {/* 👇 වයස — අංකයක් විතරක් නෙවෙයි, "වයස අවු. 32" කියලා පැහැදිලිව */}
            {profile.age ? (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                <Cake className="h-3.5 w-3.5" /> {t.profile.age.replace("{age}", String(profile.age))}
              </div>
            ) : null}
            <div className="absolute bottom-2 right-2 z-20 bg-background/80 backdrop-blur-md px-2 py-1 rounded-lg border border-border shadow-sm flex items-center justify-center text-lg leading-none">{getCountryFlag(profile.country)}</div>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
                    <span className="truncate">{profile.full_name}</span>
                  </h2>
                  <div className="mt-1.5 flex flex-col gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 capitalize"><User className="h-3.5 w-3.5 shrink-0" /> {tr(profile.gender)}</div>
                    {/* 👇 නගරය (නැත්නම් දිස්ත්‍රික්කය) + රට */}
                    <div className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{[profile.city || profile.district, profile.country].filter(Boolean).map((x) => tr(x as string)).join(", ")}</span></div>
                  </div>
                </div>
                {/* 👇 ගැලපීමේ ප්‍රතිශතය — රවුම් progress එකකින් */}
                {match && <MiniMatchRing percent={match.percent} title={t.match.percent.replace("{p}", String(match.percent))} />}
              </div>
            </div>
            {/* 👇 Interest එකේ තත්ත්වය අනුව button එක වෙනස් වෙනවා (එකම කෙනෙකුට දෙපාරක් යවන්න බෑ) */}
            {interestStatus === "sent" ? (
              <button disabled title={t.profile.pendingHint} onClick={(e) => e.stopPropagation()} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 py-2 text-sm font-bold cursor-default">
                <Clock className="h-3.5 w-3.5" /> {t.profile.interestSent}
              </button>
            ) : interestStatus === "received" ? (
              <button onClick={(e) => { e.stopPropagation(); handleSendInterest(profile.id); }} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white py-2 text-sm font-bold shadow-md shadow-primary/20 transition hover:opacity-90 active:scale-95 cursor-pointer">
                <Heart className="h-3.5 w-3.5 fill-current" /> {t.profile.respond}
              </button>
            ) : interestStatus === "accepted" ? (
              <button onClick={(e) => { e.stopPropagation(); handleSendInterest(profile.id); }} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 py-2 text-sm font-bold transition hover:bg-green-500 hover:text-white active:scale-95 cursor-pointer">
                <MessageCircle className="h-3.5 w-3.5" /> {t.profile.chat}
              </button>
            ) : (
              // 👇 කෙලින්ම යවන්නේ නෑ — මුලින්ම profile details popup එක පෙන්නනවා, එතනින් තමයි interest එක යවන්නේ
              <button onClick={(e) => { e.stopPropagation(); onSelectProfile({ ...profile, isBlurred, interestStatus }); }} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-primary py-2 text-sm font-bold transition hover:bg-primary hover:text-white active:scale-95 cursor-pointer">
                <Heart className="h-3.5 w-3.5" /> {t.profile.sendInterest}
              </button>
            )}
          </div>
        </div>
        </React.Fragment>
      )})}
    </div>
  );
});
ProfileGrid.displayName = "ProfileGrid";

// 👇 ✅ Browse grid එක ඇතුළේ "නිල් ලකුණ ගන්න" tile එක (profile tile එකක ප්‍රමාණයටම)
function VerifyPromoTile({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLang();
  const H = t.home;
  const O = t.offer;
  const spots = useFoundingSpotsLeft();
  const founding = spots !== null && spots > 0;
  return (
    // 👇 col-span-2 — profile tiles දෙකක පළලට (phone එකේ සම්පූර්ණ පේළියම)
    <div className="relative col-span-2 flex flex-col gap-5 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0B2350_0%,#14478F_55%,#1D9BF0_100%)] p-6 text-white shadow-lg shadow-blue-900/20 sm:flex-row sm:items-center">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <button type="button" onClick={onDismiss} aria-label="Close" className="absolute right-2.5 top-2.5 z-10 rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
      <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white shadow-xl"><BadgeCheck className="h-12 w-12 fill-[#1D9BF0] text-white" /></span>
      <div className="relative min-w-0 flex-1">
        <h3 className="text-xl font-extrabold leading-snug">{H.browseVerTitle}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-white/80">{H.browseVerText}</p>
        {OFFER_ACTIVE(spots) && (
          <p className="mt-3 inline-block rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold leading-relaxed">
            🎁 {founding ? O.founding.replace("{limit}", String(FOUNDING_LIMIT)).replace("{months}", String(FOUNDING_MONTHS)) : O.verifyReward}
            {founding && <span className="ml-1 text-amber-200">· {O.spotsLeft.replace("{n}", String(spots))}</span>}
          </p>
        )}
        <Link href="/verify" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#14478F] shadow-md transition hover:-translate-y-0.5">
          <BadgeCheck className="h-4 w-4 fill-[#1D9BF0] text-white" /> {O.cta}
        </Link>
      </div>
    </div>
  );
}

export default function BrowseClient({ initialProfiles, currentUser, acceptedUserIds, sentUserIds = [], receivedUserIds = [], viewerProfile = null }: { initialProfiles: Profile[], currentUser: any, acceptedUserIds: string[], sentUserIds?: string[], receivedUserIds?: string[], viewerProfile?: Record<string, unknown> | null }) {
  const router = useRouter();
  const supabase = createClient();
  const { showAlert, showConfirm } = useDialog();
  const { t, lang } = useLang();
  const tr = useTr(); // 👈 Values (Divorced, Buddhist, Galle...) language එකට
  const B = t.browse; // 👈 Labels (Filters, Religion, Clear All...) language එකට

  // 👇 මම interest යවපු අය (අලුතින් යැව්වම මෙතනට එකතු වෙනවා)
  const [sentIds, setSentIds] = useState<string[]>(sentUserIds);
  const sendingRef = useRef<Set<string>>(new Set()); // එකම button එක දෙපාරක් ඉක්මනට click කළොත්

  const getInterestStatus = useCallback((userId: string): InterestStatus => {
    if (acceptedUserIds.includes(userId)) return "accepted";
    if (sentIds.includes(userId)) return "sent";
    if (receivedUserIds.includes(userId)) return "received";
    return "none";
  }, [acceptedUserIds, sentIds, receivedUserIds]);
  
  const [sortBy, setSortBy] = useState("latest"); 
  // 👇 ✅ "ගිණුම තහවුරු කරගන්න" tile එක — verify වෙලා නැති අයට හැම වෙලේම. ✕ කළොත් refresh කරනකම් විතරයි සැඟවෙන්නේ.
  //    පේළි දෙකකට පස්සේ, page එකට එන හැම පාරම වෙනස් තැනක (8–19 අතර random)
  const [promoHidden, setPromoHidden] = useState(false);
  const [promoAt, setPromoAt] = useState(10);
  useEffect(() => {
    const id = setTimeout(() => setPromoAt(8 + Math.floor(Math.random() * 12)), 0);
    return () => clearTimeout(id);
  }, []);
  const showVerifyPromo = !promoHidden && !!viewerProfile && viewerProfile.id_verified !== "Yes";
  const dismissVerifyPromo = () => setPromoHidden(true);
  // 👇 Default එක: මම පිරිමි නම් "ගැහැණු", ගැහැණු නම් "පිරිමි", නොදන්නවා නම් "ඕනෑම"
  const defaultGender = (() => {
    const g = String(viewerProfile?.gender ?? "").toLowerCase();
    return g === "male" ? "female" : g === "female" ? "male" : "all";
  })();
  const [filterGender, setFilterGender] = useState(defaultGender);
  const [minAge, setMinAge] = useState(MIN_AGE.toString());
  const [maxAge, setMaxAge] = useState(MAX_AGE.toString());
  
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterDistrict, setFilterDistrict] = useState<string[]>([]);
  const [filterEducation, setFilterEducation] = useState<string[]>([]);
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string[]>([]);
  const [filterReligion, setFilterReligion] = useState<string[]>([]);
  const [filterCaste, setFilterCaste] = useState<string[]>([]);
  const [filterProfession, setFilterProfession] = useState<string[]>([]);
  const [filterIncome, setFilterIncome] = useState("");
  
  const [filterFood, setFilterFood] = useState("");
  const [filterDrinking, setFilterDrinking] = useState("");
  const [filterSmoking, setFilterSmoking] = useState("");
  const [filterDiffAbled, setFilterDiffAbled] = useState("");
  const [filterAccCreated, setFilterAccCreated] = useState("");
  const [filterIdVerified, setFilterIdVerified] = useState("");
  
  const [withPhotos, setWithPhotos] = useState(false);

  // 👇 මුලින්ම screen එක පිරෙන්න tiles 20ක් (පේළි 4ක් × 5), scroll කරනකොට තව 15 බැගින්
  const [visibleCount, setVisibleCount] = useState(PAGE_FIRST);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [afterSend, setAfterSend] = useState<{ name: string; list: any[] } | null>(null); // 💌 කැමැත්ත යැව්වාට පස්සේ යෝජනා

  const [openSection, setOpenSection] = useState<string>("gender");
  // 📱 update-64: phone / පොඩි tablet එකේ filters පහළින් එන sheet එකක (laptop එකේ කලින් වගේ වම් පැත්තේ)
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    const onResize = () => { if (window.innerWidth >= 1024) setFiltersOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, [filtersOpen]);

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? "" : section);
  };

  useEffect(() => { setVisibleCount(PAGE_FIRST); }, [sortBy, filterGender, minAge, maxAge, filterCountry, filterDistrict, filterEducation, filterMaritalStatus, filterReligion, filterCaste, filterProfession, filterIncome, filterFood, filterDrinking, filterSmoking, filterDiffAbled, filterAccCreated, filterIdVerified, withPhotos]);

  // 👇 මගේ profile එකත් එක්ක හැම කෙනෙක්ගෙම ගැලපීමේ ප්‍රතිශතය
  const matches = useMemo(() => {
    const m = new Map<string, MatchResult>();
    for (const p of initialProfiles) m.set(p.id, computeMatch(viewerProfile, p as unknown as Record<string, unknown>));
    return m;
  }, [initialProfiles, viewerProfile]);

  // 💞 අද ඔබට ගැලපෙන 5 දෙනා — ගැලපීම් % ඉහළම 15න්, අද දවසට අනුව (හැමෝටම එකම පිළිවෙළ නොවෙන්න user id එකත් එක්ක) 5ක්
  const hasPrefs = !!(viewerProfile?.partner_prefs && Object.keys(viewerProfile.partner_prefs as object).length);
  // 💎 "අද ඔබට 5 දෙනා" Premium අයට විතරයි (ගෙවපු / Founding / refer තෑගි — premium_until තවම ඉවර නැත්නම්)
  const isPremium = isBoosted(viewerProfile?.premium_until as string | null | undefined);
  // 👋 update-65: අලුත් user කෙනෙක් මුලින්ම Browse එකට ආවම customer support එකෙන් සාදර පිළිගැනීමේ message එකක් (server එකේ එක පාරයි)
  useEffect(() => {
    if (!currentUser?.id) return;
    const key = `hm_welcome_${currentUser.id}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { /* private mode */ }
    fetch("/api/support/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang }) }).catch(() => {});
  }, [currentUser?.id, lang]);

  // 💌 update-65: Free අයට මේ මාසයේ ඉතුරු කැමැත්ත ගණන (Browse එකේ උඩ පේනවා)
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!currentUser?.id || isPremium) { setFreeLeft(null); return; }
    let active = true;
    interestQuota(supabase, currentUser.id, null).then((q) => { if (active) setFreeLeft(q.left); });
    return () => { active = false; };
  }, [currentUser?.id, isPremium, supabase, sentIds.length]);
  const todayPicks = useMemo(() => {
    if (!viewerProfile) return [] as Profile[];
    const pool = initialProfiles
      // 👇 පිරිමි කෙනෙකුට ගැහැණු අය, ගැහැණු කෙනෙකුට පිරිමි අය විතරයි
      .filter((p) => defaultGender === "all" || String(p.gender ?? "").toLowerCase() === defaultGender)
      .filter((p) => getInterestStatus(p.id) === "none" || getInterestStatus(p.id) === "received")
      .map((p) => ({ p, pct: matches.get(p.id)?.rawPercent ?? -1 }))
      .filter((x) => x.pct >= 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 15);
    const day = new Date().toISOString().slice(0, 10);
    const seed = (id: string) => { let h = 0; for (const ch of `${day}${currentUser?.id ?? ""}${id}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
    return pool.sort((a, b) => seed(a.p.id) - seed(b.p.id)).slice(0, 5).sort((a, b) => b.pct - a.pct).map((x) => x.p);
  }, [viewerProfile, initialProfiles, matches, getInterestStatus, currentUser?.id, defaultGender]);

  // 👇 ඇරයුමක් යැව්වාට පස්සේ පෙන්නන "ඔබ කැමති විය හැකි" profiles 4ක්:
  //    තවම සම්බන්ධ නොවූ, ඒ කෙනාට සමාන (ආගම / වයස / ස්ත්‍රී-පුරුෂ), ගැලපීම % වැඩිම අය
  const suggestionsFor = useCallback((base: any) => {
    const age = Number(base?.age) || 0;
    return initialProfiles
      .filter((p) => p.id !== base?.id && getInterestStatus(p.id) === "none" && (!base?.gender || p.gender === base.gender))
      .map((p) => {
        // 👇 ගැලපීම % වැඩිම 4 දෙනා (සමාන නම්: එකම ආගම / ළඟ වයස මුලින්)
        const m = matches.get(p.id)?.percent ?? -1;
        const similar = (p.religion && p.religion === base?.religion ? 1 : 0) + (age && p.age ? Math.max(0, 1 - Math.abs(Number(p.age) - age) / 10) : 0);
        return { p, m, similar };
      })
      .sort((a, b) => b.m - a.m || b.similar - a.similar)
      .slice(0, 6)
      .map(({ p }) => ({ ...p, isBlurred: (p as any).blur_photo === true && !acceptedUserIds.includes(p.id), interestStatus: "none" as InterestStatus }));
  }, [initialProfiles, getInterestStatus, matches, acceptedUserIds]);

  const filteredProfiles = useMemo(() => {
    let result = initialProfiles.filter((profile) => {
      const matchesGender = filterGender === "all" || profile.gender === filterGender;
      const matchesMinAge = profile.age >= parseInt(minAge);
      const matchesMaxAge = profile.age <= parseInt(maxAge);
      
      const matchesCountry = filterCountry.length === 0 || (profile.country && filterCountry.includes(profile.country));
      const matchesDistrict = filterDistrict.length === 0 || (profile.district && filterDistrict.includes(profile.district));
      const matchesEducation = filterEducation.length === 0 || (profile.education && filterEducation.includes(profile.education));
      const matchesMarital = filterMaritalStatus.length === 0 || (profile.civil_status && filterMaritalStatus.includes(profile.civil_status));
      const matchesReligion = filterReligion.length === 0 || (profile.religion && filterReligion.includes(profile.religion));
      const matchesCaste = filterCaste.length === 0 || (profile.caste && filterCaste.includes(profile.caste));
      const matchesProfession = filterProfession.length === 0 || (profile.job_title && filterProfession.includes(profile.job_title));

      const matchesIncome = filterIncome ? profile.income === filterIncome : true;
      const matchesPhotos = withPhotos ? !!profile.avatar_url : true;

      const matchesFood = filterFood ? profile.food_preference === filterFood : true;
      const matchesDrinking = filterDrinking ? profile.drinking === filterDrinking : true;
      const matchesSmoking = filterSmoking ? profile.smoking === filterSmoking : true;
      const matchesDiffAbled = filterDiffAbled ? profile.differently_abled === filterDiffAbled : true;
      const matchesAccCreated = filterAccCreated ? profile.account_created_by === filterAccCreated : true;
      const matchesIdVerified = filterIdVerified ? profile.id_verified === filterIdVerified : true;

      return matchesGender && matchesMinAge && matchesMaxAge && 
             matchesCountry && matchesDistrict && matchesEducation && matchesMarital && matchesReligion && matchesCaste &&
             matchesProfession && matchesIncome && matchesPhotos &&
             matchesFood && matchesDrinking && matchesSmoking && matchesDiffAbled && 
             matchesAccCreated && matchesIdVerified;
    });

    if (sortBy === "latest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (sortBy === "age_asc") {
      result.sort((a, b) => a.age - b.age);
    } else if (sortBy === "age_desc") {
      result.sort((a, b) => b.age - a.age);
    } else if (sortBy === "height_asc") {
      result.sort((a, b) => getHeightInInches(a.height) - getHeightInInches(b.height));
    } else if (sortBy === "height_desc") {
      result.sort((a, b) => getHeightInInches(b.height) - getHeightInInches(a.height));
    } else if (sortBy === "match") {
      result.sort((a, b) => (matches.get(b.id)?.percent ?? -1) - (matches.get(a.id)?.percent ?? -1));
    }

    // ⚡ Boost කරපු අය හැම sort එකකම උඩින්ම (ඔවුන් අතරේ පිළිවෙළ එහෙමම)
    const boosted = result.filter((p) => isBoosted(p.boosted_until));
    if (boosted.length) result = [...boosted, ...result.filter((p) => !isBoosted(p.boosted_until))];
    return result;
  }, [initialProfiles, matches, sortBy, filterGender, minAge, maxAge, filterCountry, filterDistrict, filterEducation, filterMaritalStatus, filterReligion, filterCaste, filterProfession, filterIncome, filterFood, filterDrinking, filterSmoking, filterDiffAbled, filterAccCreated, filterIdVerified, withPhotos]);

  useEffect(() => {
    if (visibleCount >= filteredProfiles.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisibleCount((prev) => prev + PAGE_MORE);
    }, { rootMargin: "600px 0px" }); // පහළට එන්න කලින්ම (600px කලින්) ඊළඟ ටික load කරනවා
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); };
  }, [visibleCount, filteredProfiles.length]);

  // 👇 Profile popup එකෙන් interest එක යවනවා. ප්‍රතිඵලය popup එකට ආපහු දෙනවා (popup එක ඇතුළේම පෙන්නන්න)
  // 👀 Login නැති අය profile එකක් open කරන්න / කැමැත්ත යවන්න හැදුවොත් — login / register වෙන්න කියනවා
  const askLogin = useCallback(async () => {
    const ok = await showConfirm({ title: t.extra.guestTitle, message: t.extra.guestMsg, confirmText: t.nav.login, tone: "default" });
    if (ok) router.push("/login?next=/browse");
    return { status: "navigated" as const };
  }, [showConfirm, router, t]);

  const handleSendInterest = useCallback(async (receiverId: string): Promise<SendInterestResult> => {
    if (!currentUser) { askLogin(); return { status: "navigated" }; }
    if (currentUser.id === receiverId) return { status: "error", message: B.thatsYouMsg };
    // 🔒 තමන්ගේ පැතිකඩ publish කරලා නැත්නම් කැමැත්ත යවන්න බෑ (DB එකෙනුත් නවත්වනවා)
    if (viewerProfile && viewerProfile.is_published !== true) {
      const ok = await showConfirm({ title: t.extra.publishFirstTitle, message: t.extra.publishFirstMsg, confirmText: t.extra.publishFirstCta, tone: "default" });
      if (ok) router.push("/profile");
      return { status: "navigated" };
    }

    const status = getInterestStatus(receiverId);
    // දැනටමත් connect වෙලා නම් කෙලින්ම chat එකට
    if (status === "accepted") { router.push(`/chat?userId=${receiverId}`); return { status: "navigated" }; }
    // එයාලා දැනටමත් මට interest එකක් එවලා නම් Interests page එකට
    if (status === "received") { router.push("/interests"); return { status: "navigated" }; }
    // දැනටමත් යවලා නම් ආයේ යවන්නේ නෑ
    if (status === "sent") return { status: "already", message: B.alreadySentMsg };

    if (sendingRef.current.has(receiverId)) return { status: "already" };

    // 💌 update-65: Free පැකේජයට මාසයකට කැමැත්ත 5යි — ඉවර නම් Gold පැකේජයට යොමු කරනවා
    const askGold = async () => {
      const ok = await showConfirm({ title: t.plans.limitTitle, message: t.plans.limitMsg, confirmText: t.plans.limitCta, tone: "default" });
      if (ok) router.push("/pricing");
      return { status: "navigated" as const };
    };
    const quota = await interestQuota(supabase, currentUser.id, viewerProfile?.premium_until as string | null | undefined);
    if (!quota.allowed) return askGold();

    sendingRef.current.add(receiverId);
    const { error } = await supabase.from("interests").insert({ sender_id: currentUser.id, receiver_id: receiverId });
    sendingRef.current.delete(receiverId);

    if (error) {
      if (isLimitError(error)) return askGold(); // 👈 DB trigger එකෙන් නැවැත්තුවොත්
      // 23505 = database එකේ duplicate එකක්
      if (error.code === "23505") {
        setSentIds((prev) => (prev.includes(receiverId) ? prev : [...prev, receiverId]));
        return { status: "already", message: B.alreadyActiveMsg };
      }
      return { status: "error", message: `${B.cantSendTitle}: ${error.message}` };
    }
    setSentIds((prev) => [...prev, receiverId]);
    track("send_interest"); // 📊 update-65
    return { status: "sent" };
  }, [currentUser, router, supabase, getInterestStatus, B, askLogin, viewerProfile, showConfirm, t]);

  const clearFilters = useCallback(() => {
    setSortBy("latest");
    setFilterGender(defaultGender); 
    setMinAge(MIN_AGE.toString()); setMaxAge(MAX_AGE.toString()); 
    setFilterCountry([]); setFilterDistrict([]); setFilterEducation([]); 
    setFilterMaritalStatus([]); setFilterReligion([]);
    setFilterCaste([]); setFilterProfession([]); 
    setFilterIncome(""); setWithPhotos(false);
    setFilterFood(""); setFilterDrinking(""); setFilterSmoking("");
    setFilterDiffAbled(""); setFilterAccCreated(""); setFilterIdVerified("");
  }, [defaultGender]); // 👈 defaultGender — පරණ (stale) අගයක් අල්ලගන්නේ නැති වෙන්න

  // 👇 දැනට තෝරලා තියෙන filters එක object එකකට (Save කරන්න)
  const currentFilters: FilterValues = useMemo(() => ({
    sortBy, gender: filterGender, minAge, maxAge,
    country: filterCountry, district: filterDistrict, education: filterEducation,
    marital: filterMaritalStatus, religion: filterReligion, caste: filterCaste, profession: filterProfession,
    income: filterIncome, food: filterFood, drinking: filterDrinking, smoking: filterSmoking,
    diffAbled: filterDiffAbled, accCreated: filterAccCreated, idVerified: filterIdVerified, withPhotos,
  }), [sortBy, filterGender, minAge, maxAge, filterCountry, filterDistrict, filterEducation, filterMaritalStatus, filterReligion, filterCaste, filterProfession, filterIncome, filterFood, filterDrinking, filterSmoking, filterDiffAbled, filterAccCreated, filterIdVerified, withPhotos]);

  // 👇 Save කරපු filters එක click එකකින් apply කරනවා
  const applySavedFilters = useCallback((f: Partial<FilterValues>) => {
    setSortBy(f.sortBy || "latest");
    setFilterGender(f.gender || "all");
    setMinAge(f.minAge || MIN_AGE.toString()); setMaxAge(f.maxAge || MAX_AGE.toString());
    setFilterCountry(f.country ?? []); setFilterDistrict(f.district ?? []); setFilterEducation(f.education ?? []);
    setFilterMaritalStatus(f.marital ?? []); setFilterReligion(f.religion ?? []);
    setFilterCaste(f.caste ?? []); setFilterProfession(f.profession ?? []);
    setFilterIncome(f.income ?? ""); setWithPhotos(!!f.withPhotos);
    setFilterFood(f.food ?? ""); setFilterDrinking(f.drinking ?? ""); setFilterSmoking(f.smoking ?? "");
    setFilterDiffAbled(f.diffAbled ?? ""); setFilterAccCreated(f.accCreated ?? ""); setFilterIdVerified(f.idVerified ?? "");
  }, []);

  const applyAgeFilter = useCallback((newMin: string, newMax: string) => {
    setMinAge(newMin);
    setMaxAge(newMax);
  }, []);

  const toggleCountry = (val: string) => setFilterCountry(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleDistrict = (val: string) => setFilterDistrict(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleEducation = (val: string) => setFilterEducation(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleMarital = (val: string) => setFilterMaritalStatus(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleReligion = (val: string) => setFilterReligion(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleCaste = (val: string) => setFilterCaste(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);
  const toggleProfession = (val: string) => setFilterProfession(prev => prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]);

  const activeFilters = useMemo(() => {
    const filters: { type: string, value: string, label: string }[] = [];
    // 👇 Default gender එක (මට විරුද්ධ ලිංගය) "active filter" එකක් නෙවෙයි — ඒක වෙනස් කළොත් විතරයි chip එක
    //    (කලින් Clear all කළාම default එකට ආපහු ගියත් chip එක පේන නිසා filters clear වුණේ නෑ වගේ පෙනුණා)
    if (filterGender !== defaultGender) filters.push({ type: "gender", value: filterGender, label: filterGender === "all" ? `${B.gender}: ${t.extra.any}` : String(tr(filterGender.charAt(0).toUpperCase() + filterGender.slice(1))) });
    if (parseInt(minAge) > MIN_AGE || parseInt(maxAge) < MAX_AGE) filters.push({ type: "age", value: "age", label: `${B.age}: ${minAge} - ${maxAge}` });
    filterCountry.forEach(c => filters.push({ type: "country", value: c, label: String(tr(c)) }));
    filterDistrict.forEach(d => filters.push({ type: "district", value: d, label: String(tr(d)) }));
    filterEducation.forEach(e => filters.push({ type: "education", value: e, label: String(tr(e)) }));
    filterMaritalStatus.forEach(m => filters.push({ type: "marital", value: m, label: String(tr(m)) }));
    filterReligion.forEach(r => filters.push({ type: "religion", value: r, label: String(tr(r)) }));
    filterCaste.forEach(c => filters.push({ type: "caste", value: c, label: String(tr(c)) }));
    filterProfession.forEach(p => filters.push({ type: "profession", value: p, label: String(tr(p)) }));
    if (filterIncome) filters.push({ type: "income", value: filterIncome, label: String(tr(filterIncome)) });
    if (filterFood) filters.push({ type: "food", value: filterFood, label: String(tr(filterFood)) });
    if (filterDrinking) filters.push({ type: "drinking", value: filterDrinking, label: `${B.drinking}: ${tr(filterDrinking)}` });
    if (filterSmoking) filters.push({ type: "smoking", value: filterSmoking, label: `${B.smoking}: ${tr(filterSmoking)}` });
    if (filterDiffAbled) filters.push({ type: "disabled", value: filterDiffAbled, label: `${B.differentlyAbled}: ${tr(filterDiffAbled)}` });
    if (filterAccCreated) filters.push({ type: "creator", value: filterAccCreated, label: String(tr(filterAccCreated)) });
    if (filterIdVerified) filters.push({ type: "verified", value: filterIdVerified, label: `${B.idVerified}: ${tr(filterIdVerified)}` });
    if (withPhotos) filters.push({ type: "photos", value: "yes", label: B.withPhotos });
    return filters;
  }, [filterGender, defaultGender, minAge, maxAge, filterCountry, filterDistrict, filterEducation, filterMaritalStatus, filterReligion, filterCaste, filterProfession, filterIncome, filterFood, filterDrinking, filterSmoking, filterDiffAbled, filterAccCreated, filterIdVerified, withPhotos, tr, B, t]);

  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case "gender": setFilterGender(defaultGender); break;
      case "age": setMinAge(MIN_AGE.toString()); setMaxAge(MAX_AGE.toString()); break;
      case "country": toggleCountry(value); break;
      case "district": toggleDistrict(value); break;
      case "education": toggleEducation(value); break;
      case "marital": toggleMarital(value); break;
      case "religion": toggleReligion(value); break;
      case "caste": toggleCaste(value); break;
      case "profession": toggleProfession(value); break;
      case "income": setFilterIncome(""); break;
      case "food": setFilterFood(""); break;
      case "drinking": setFilterDrinking(""); break;
      case "smoking": setFilterSmoking(""); break;
      case "disabled": setFilterDiffAbled(""); break;
      case "creator": setFilterAccCreated(""); break;
      case "verified": setFilterIdVerified(""); break;
      case "photos": setWithPhotos(false); break;
    }
  };

  return (
    <>
    {/* 👇 Page title එක language එකට අනුව */}
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{B.title}</h1>
      <p className="mt-2 text-muted-foreground">{B.subtitle}</p>
    </div>
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* Filter Sidebar — 📱 update-64: lg ට අඩු screen වල පහළින් එන sheet එකක් ("පෙරහන්" button එකෙන් open වෙනවා) */}
      <div className={`browse-filters shrink-0 lg:block lg:w-80 ${filtersOpen ? "fixed inset-0 z-[150] block" : "hidden"}`}>
        {/* පිටුපස අඳුරු කොටස (phone එකේ) — ඔබලා වහන්න */}
        <div aria-hidden onClick={() => setFiltersOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200 lg:hidden" />
        {/* 👇 Filters කොටසේ අකුරු ටිකක් ලොකු කරනවා */}
        <style href="browse-filters-text" precedence="default">
          {`.browse-filters .text-sm{font-size:1rem;line-height:1.5rem}.browse-filters .text-xs{font-size:.875rem;line-height:1.25rem}`}
        </style>
        {/* 👇 "පෙරහන්" title එකයි "සුරැකි පෙරහන්" එකයි fix — යට filters කොටස විතරයි scroll වෙන්නේ */}
        <div role={filtersOpen ? "dialog" : undefined} aria-modal={filtersOpen || undefined} aria-label={B.filters} className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-8 duration-300 lg:sticky lg:inset-auto lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:animate-none lg:rounded-3xl lg:shadow-sm">
          {/* 📱 Sheet එකේ උඩ ඇදගන්න ඉර */}
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 lg:hidden" />
          <div className="shrink-0 px-4 pt-4 sm:px-6 lg:pt-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> {B.filters}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearFilters} className="px-2 py-1 text-xs text-primary font-semibold hover:underline cursor-pointer">
                {B.clearAll}
              </button>
              {/* 📱 වහන්න (phone එකේ විතරයි) */}
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted lg:hidden"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* 👇 Filters save කරලා පස්සේ එක click එකකින් apply කරන්න */}
          <SavedFilters
            userId={currentUser?.id}
            currentFilters={currentFilters}
            hasActiveFilters={activeFilters.length > 0 || sortBy !== "latest"}
            onApply={applySavedFilters}
          />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 custom-scrollbar sm:px-6">
            <AccordionSection title={B.gender} isOpen={openSection === "gender"} onToggle={() => toggleSection("gender")} hasActiveFilters={filterGender !== defaultGender}>
              {/* 👇 Radio options 3ක් icons එක්ක */}
              <div role="radiogroup" aria-label={B.gender} className="grid grid-cols-3 gap-2">
                {([
                  { value: "female", label: String(tr("Female")), icon: Venus },
                  { value: "male", label: String(tr("Male")), icon: Mars },
                  { value: "all", label: t.extra.any, icon: Users },
                ]).map((g) => {
                  const active = filterGender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFilterGender(g.value)}
                      className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2.5 text-center text-xs font-semibold leading-tight transition ${
                        active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <g.icon className="h-5 w-5" aria-hidden="true" />
                      <span className="w-full break-words">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionSection>

            <AccordionSection title={B.ageRange} isOpen={openSection === "age"} onToggle={() => toggleSection("age")} hasActiveFilters={parseInt(minAge) > MIN_AGE || parseInt(maxAge) < MAX_AGE}>
              <AgeSlider initialMin={minAge} initialMax={maxAge} onApply={applyAgeFilter} />
            </AccordionSection>

            <AccordionSection title={B.maritalStatus} isOpen={openSection === "marital"} onToggle={() => toggleSection("marital")} hasActiveFilters={filterMaritalStatus.length > 0}>
              {MARITAL_STATUS_LIST.map((status) => (
                <CustomCheckbox key={status} label={String(tr(status))} checked={filterMaritalStatus.includes(status)} onChange={() => toggleMarital(status)} />
              ))}
            </AccordionSection>

            <AccordionSection title={B.religion} isOpen={openSection === "religion"} onToggle={() => toggleSection("religion")} hasActiveFilters={filterReligion.length > 0}>
              {RELIGION_LIST.map((rel) => (
                <CustomCheckbox key={rel} label={String(tr(rel))} checked={filterReligion.includes(rel)} onChange={() => toggleReligion(rel)} />
              ))}
            </AccordionSection>

            <AccordionSection title={B.caste} isOpen={openSection === "caste"} onToggle={() => toggleSection("caste")} hasActiveFilters={filterCaste.length > 0}>
              <div className="space-y-1">
                {CASTE_LIST.map((caste) => (
                  <CustomCheckbox key={caste} label={String(tr(caste))} checked={filterCaste.includes(caste)} onChange={() => toggleCaste(caste)} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={B.country} isOpen={openSection === "country"} onToggle={() => toggleSection("country")} hasActiveFilters={filterCountry.length > 0}>
              <div className="space-y-1">
                {COUNTRY_LIST.map((country) => (
                  <CustomCheckbox key={country} label={String(tr(country))} checked={filterCountry.includes(country)} onChange={() => toggleCountry(country)} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={B.district} isOpen={openSection === "district"} onToggle={() => toggleSection("district")} hasActiveFilters={filterDistrict.length > 0}>
              <div className="space-y-1">
                {DISTRICT_LIST.map((district) => (
                  <CustomCheckbox key={district} label={String(tr(district))} checked={filterDistrict.includes(district)} onChange={() => toggleDistrict(district)} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={B.education} isOpen={openSection === "education"} onToggle={() => toggleSection("education")} hasActiveFilters={filterEducation.length > 0}>
              <div className="space-y-1">
                {EDUCATION_LIST.map((edu) => (
                  <CustomCheckbox key={edu} label={String(tr(edu))} checked={filterEducation.includes(edu)} onChange={() => toggleEducation(edu)} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={B.profession} isOpen={openSection === "profession"} onToggle={() => toggleSection("profession")} hasActiveFilters={filterProfession.length > 0}>
              <div className="space-y-1">
                {PROFESSION_LIST.map((prof) => (
                  <CustomCheckbox key={prof} label={String(tr(prof))} checked={filterProfession.includes(prof)} onChange={() => toggleProfession(prof)} />
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title={B.monthlyIncome} isOpen={openSection === "income"} onToggle={() => toggleSection("income")} hasActiveFilters={filterIncome !== ""}>
              <div className="relative">
                <select value={filterIncome} onChange={(e) => setFilterIncome(e.target.value)} className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary text-sm appearance-none cursor-pointer">
                  <option value="">{B.anyIncome}</option>
                  <option value="LKR 50k - 100k">{tr("LKR 50k - 100k")}</option>
                  <option value="LKR 100k - 200k">{tr("LKR 100k - 200k")}</option>
                  <option value="LKR 200k - 300k">{tr("LKR 200k - 300k")}</option>
                  <option value="LKR 300k+">{tr("LKR 300k+")}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </AccordionSection>

            <AccordionSection title={B.food} isOpen={openSection === "food"} onToggle={() => toggleSection("food")} hasActiveFilters={filterFood !== ""}>
              <CustomCheckbox label={String(tr("Non Vegetarian"))} checked={filterFood === "Non Vegetarian"} onChange={() => setFilterFood(filterFood === "Non Vegetarian" ? "" : "Non Vegetarian")} />
              <CustomCheckbox label={String(tr("Vegan"))} checked={filterFood === "Vegan"} onChange={() => setFilterFood(filterFood === "Vegan" ? "" : "Vegan")} />
              <CustomCheckbox label={String(tr("Vegetarian"))} checked={filterFood === "Vegetarian"} onChange={() => setFilterFood(filterFood === "Vegetarian" ? "" : "Vegetarian")} />
            </AccordionSection>

            <AccordionSection title={B.drinking} isOpen={openSection === "drinking"} onToggle={() => toggleSection("drinking")} hasActiveFilters={filterDrinking !== ""}>
              <CustomCheckbox label={String(tr("Yes"))} checked={filterDrinking === "Yes"} onChange={() => setFilterDrinking(filterDrinking === "Yes" ? "" : "Yes")} />
              <CustomCheckbox label={String(tr("No"))} checked={filterDrinking === "No"} onChange={() => setFilterDrinking(filterDrinking === "No" ? "" : "No")} />
              <CustomCheckbox label={String(tr("Occasionally"))} checked={filterDrinking === "Occasionally"} onChange={() => setFilterDrinking(filterDrinking === "Occasionally" ? "" : "Occasionally")} />
            </AccordionSection>

            <AccordionSection title={B.smoking} isOpen={openSection === "smoking"} onToggle={() => toggleSection("smoking")} hasActiveFilters={filterSmoking !== ""}>
              <CustomCheckbox label={String(tr("Yes"))} checked={filterSmoking === "Yes"} onChange={() => setFilterSmoking(filterSmoking === "Yes" ? "" : "Yes")} />
              <CustomCheckbox label={String(tr("No"))} checked={filterSmoking === "No"} onChange={() => setFilterSmoking(filterSmoking === "No" ? "" : "No")} />
            </AccordionSection>

            <AccordionSection title={B.differentlyAbled} isOpen={openSection === "disabled"} onToggle={() => toggleSection("disabled")} hasActiveFilters={filterDiffAbled !== ""}>
              <CustomCheckbox label={String(tr("Yes"))} checked={filterDiffAbled === "Yes"} onChange={() => setFilterDiffAbled(filterDiffAbled === "Yes" ? "" : "Yes")} />
              <CustomCheckbox label={String(tr("No"))} checked={filterDiffAbled === "No"} onChange={() => setFilterDiffAbled(filterDiffAbled === "No" ? "" : "No")} />
            </AccordionSection>

            <AccordionSection title={B.accountCreatedBy} isOpen={openSection === "creator"} onToggle={() => toggleSection("creator")} hasActiveFilters={filterAccCreated !== ""}>
              <CustomCheckbox label={String(tr("Self"))} checked={filterAccCreated === "Self"} onChange={() => setFilterAccCreated(filterAccCreated === "Self" ? "" : "Self")} />
              <CustomCheckbox label={String(tr("Parents/Family"))} checked={filterAccCreated === "Parents/Family"} onChange={() => setFilterAccCreated(filterAccCreated === "Parents/Family" ? "" : "Parents/Family")} />
            </AccordionSection>

            <AccordionSection title={B.idVerified} isOpen={openSection === "verified"} onToggle={() => toggleSection("verified")} hasActiveFilters={filterIdVerified !== ""}>
              <CustomCheckbox label={String(tr("Yes"))} checked={filterIdVerified === "Yes"} onChange={() => setFilterIdVerified(filterIdVerified === "Yes" ? "" : "Yes")} />
              <CustomCheckbox label={String(tr("No"))} checked={filterIdVerified === "No"} onChange={() => setFilterIdVerified(filterIdVerified === "No" ? "" : "No")} />
            </AccordionSection>

            <AccordionSection title={B.preferences} isOpen={openSection === "preferences"} onToggle={() => toggleSection("preferences")} hasActiveFilters={withPhotos === true}>
              <CustomCheckbox label={B.onlyWithPhotos} checked={withPhotos} onChange={() => setWithPhotos(!withPhotos)} />
            </AccordionSection>
          </div>
          {/* 📱 පහළ: "ප්‍රතිඵල N බලන්න" (phone එකේ විතරයි) */}
          <div className="shrink-0 border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <button type="button" onClick={() => setFiltersOpen(false)} className="w-full rounded-xl bg-gradient-to-r from-[#D52047] to-[#AD032A] py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20 active:scale-[0.99]">
              {B.showResults.replace("{n}", String(filteredProfiles.length))}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Grid Area */}
      <div className="flex-1">
        {/* 👀 Login නැති අයට — join වෙන්න කියන banner එක */}
        {!currentUser && (
          <section className="mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-[#D52047] to-[#AD032A] p-5 text-white shadow-lg shadow-primary/20 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20"><Heart className="h-6 w-6 fill-white" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{t.extra.guestBannerTitle}</p>
              <p className="text-sm text-white/85">{t.extra.guestBannerText}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/register" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#AD032A] shadow-md">{t.hero.cta}</Link>
              <Link href="/login?next=/browse" className="rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">{t.nav.login}</Link>
            </div>
          </section>
        )}

        {/* 💞 අද ඔබට ගැලපෙන 5 දෙනා (ගැලපීම් % අනුව ඉහළම 15න් හැමදාම වෙනස් 5ක්) */}
        {/* 🔒 Premium නැති අයට: "අද ඔබට 5 දෙනා" Premium පහසුකමක් කියලා පොඩි teaser එකක් */}
        {todayPicks.length >= 3 && !isPremium && (
          <section className="mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-50 via-background to-rose-50 p-4 shadow-sm dark:from-amber-950/30 dark:to-rose-950/20 sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {todayPicks.slice(0, 4).map((p) => (
                <div key={p.id} className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-background bg-muted blur-[3px]"><CardImage src={p.avatar_url} placeholder={p.avatar_placeholder} alt="" /></div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-bold"><Crown className="h-4 w-4 text-amber-500" /> {t.prefs.todayTitle}</p>
              <p className="text-sm text-muted-foreground">{t.prefs.todayPremium}</p>
            </div>
            <Link href="/pricing" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-md">{t.prefs.todayUnlock}</Link>
          </section>
        )}
        {todayPicks.length >= 3 && isPremium && (
          <section className="mb-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-foreground"><Sparkles className="h-4 w-4 text-primary" /> {t.prefs.todayTitle}</h2>
                <p className="text-xs text-muted-foreground">{t.prefs.todaySub}</p>
              </div>
              {!hasPrefs && <Link href="/preferences" className="text-sm font-semibold text-primary hover:underline">{t.prefs.setPrefs} →</Link>}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
              {todayPicks.map((p) => {
                const isBlurred = p.blur_photo === true && !acceptedUserIds.includes(p.id);
                const m = matches.get(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => setSelectedProfile({ ...p, isBlurred, interestStatus: getInterestStatus(p.id) } as Profile)} className="group w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-background text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative h-32 w-full overflow-hidden bg-muted">
                      <CardImage src={p.avatar_url} placeholder={p.avatar_placeholder} alt={p.full_name} />
                      {m && <span className="absolute right-1.5 top-1.5 z-20 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow">{m.percent}%</span>}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-sm font-bold group-hover:text-primary">{p.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{[p.age && t.profile.age.replace("{age}", String(p.age)), p.district].filter(Boolean).join(" · ")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 👇 Grid එකේ උඩ: වම් පැත්තේ ප්‍රතිඵල ගණන + "තහවුරු වූ අය පමණක්", දකුණු පැත්තේ Sort By */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* 📱 update-64: phone / පොඩි tablet එකේ "පෙරහන්" button එක → පහළින් filters sheet එක */}
            <button type="button" onClick={() => setFiltersOpen(true)} className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:border-primary/50 hover:text-primary lg:hidden">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> {B.filters}
              {activeFilters.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">{activeFilters.length}</span>}
            </button>
            <p className="text-sm text-muted-foreground">
              {B.resultsCount.replace("{n}", String(filteredProfiles.length))}
            </p>
            {freeLeft !== null && (
              <Link href="/pricing" className={`rounded-full px-3 py-1 text-xs font-bold transition hover:opacity-80 ${freeLeft === 0 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
                💌 {t.plans.limitLeft.replace("{n}", String(freeLeft))}
              </Link>
            )}

          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm font-semibold text-muted-foreground whitespace-nowrap">{B.sortBy}</span>
            {/* 👇 Site එකට ගැලපෙන dropdown එක (default <select> එක නෙවෙයි) */}
            <Dropdown
              value={sortBy}
              onChange={setSortBy}
              ariaLabel={B.sortBy}
              align="right"
              icon={<ArrowUpDown className="h-4 w-4 text-muted-foreground" />}
              options={[
                ...(viewerProfile ? [{ value: "match", label: t.match.sortBest }] : []),
                { value: "latest", label: B.sortLatest },
                { value: "oldest", label: B.sortOldest },
                { value: "age_asc", label: B.sortAgeAsc },
                { value: "age_desc", label: B.sortAgeDesc },
                { value: "height_asc", label: B.sortHeightAsc },
                { value: "height_desc", label: B.sortHeightDesc },
              ]}
            />
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 bg-muted/30 p-3 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-semibold text-muted-foreground ml-1 mr-1">{B.activeFilters}</span>
            {activeFilters.map((filter, index) => (
              <span key={`${filter.type}-${filter.value}-${index}`} className="flex items-center gap-1.5 bg-background border border-border px-3.5 py-1.5 rounded-full text-sm font-medium text-foreground shadow-sm">
                {filter.label}
                <button onClick={() => removeFilter(filter.type, filter.value)} className="text-muted-foreground hover:text-red-500 hover:bg-muted rounded-full p-0.5 transition-colors cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-sm font-bold text-primary hover:underline ml-auto px-2 cursor-pointer">
              {B.clearAll}
            </button>
          </div>
        )}

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-20 bg-background rounded-3xl border border-border shadow-sm">
            <p className="text-muted-foreground">{B.noMatches}</p>
          </div>
        ) : (
          <>
            <ProfileGrid 
              profiles={filteredProfiles} 
              visibleCount={visibleCount} 
              onSelectProfile={currentUser ? setSelectedProfile : askLogin} 
              handleSendInterest={currentUser ? handleSendInterest : askLogin} 
              acceptedUserIds={acceptedUserIds}
              getInterestStatus={getInterestStatus}
              matches={matches}
              promo={showVerifyPromo ? <VerifyPromoTile key="verify-promo" onDismiss={dismissVerifyPromo} /> : null}
              promoAt={promoAt}
            />
            
            {visibleCount < filteredProfiles.length && (
              <div ref={loaderRef} className="flex items-center justify-center py-10 mt-4"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
            )}
            {visibleCount >= filteredProfiles.length && (
              <div className="text-center py-10 mt-4 text-muted-foreground text-sm">{B.seenAll}</div>
            )}
          </>
        )}
      </div>

      {selectedProfile && (
        <ProfileModal
          key={selectedProfile.id}
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSendInterest={async (id) => {
            const r = await handleSendInterest(id);
            // 💌 යැව්ව ගමන් popup එක වහලා "තවත් ගැලපෙන අය" අලුත් popup එක (✓ එක පේන්න පොඩි වෙලාවක් දීලා)
            if (r.status === "sent") {
              const base = selectedProfile;
              const list = suggestionsFor(base);
              setTimeout(() => {
                setSelectedProfile(null);
                if (list.length) setAfterSend({ name: base.full_name, list });
              }, 350); // 👈 "✓ යැව්වා" පේන්න පොඩි මොහොතක් විතරයි
            }
            return r;
          }}
          onBlocked={() => router.refresh()}
          onOpenProfile={(p) => setSelectedProfile(p)}
        />
      )}
      {afterSend && (
        <AfterSendDialog
          name={afterSend.name}
          profiles={afterSend.list}
          matchOf={(id) => matches.get(id)?.percent ?? null}
          onSend={handleSendInterest}
          onView={(p) => { setAfterSend(null); setSelectedProfile({ ...(p as Profile), isBlurred: (p as Profile).blur_photo === true && !acceptedUserIds.includes(p.id), interestStatus: getInterestStatus(p.id) } as Profile); }}
          onClose={() => setAfterSend(null)}
        />
      )}
    </div>
    </>
  );
}