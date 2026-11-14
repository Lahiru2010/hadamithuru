// components/ProfileWizard.tsx
// My Profile page එකේ profile details පියවරෙන් පියවර ඇතුළත් කරන wizard එක.
//  - හැම පියවරකම "Save & Continue" ඔබනකොට ඒ පියවරේ details database එකේ save වෙනවා
//    (මැද්දෙන් නැවැත්තුවත් කලින් දාපු ඒවා නැති වෙන්නේ නෑ).
//  - උඩ තියෙන steps click කරලා ඕනම පියවරකට යන්න පුළුවන්.
//  - Labels i18n එකෙන්, values option_translations එකෙන් — language එකට අනුව වෙනස් වෙනවා.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Star, MapPin, GraduationCap, Users, Heart, Camera, ClipboardCheck,
  Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Pencil, BadgeCheck, Lock, Globe2, EyeOff, Eye, Sparkles, ShieldCheck, Copy,
} from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useTr } from "@/components/OptionTranslations";
import { useDialog } from "@/components/DialogProvider";
import ProfilePhotoCard from "@/components/ProfilePhotoCard";
import HobbyIcon from "@/components/HobbyIcon";
import { ProfileModal } from "@/components/ProfileModal";
import PhotoGalleryManager from "@/components/PhotoGalleryManager";
import Dropdown from "@/components/ui/Dropdown";
import AvatarImage from "@/components/AvatarImage";
import { DEFAULT_PHONE_COUNTRY, formatPhone, normalizePhone, parsePhone } from "@/lib/phone";
import PhoneInput from "@/components/PhoneInput";
import HoroscopeEditor from "@/components/HoroscopeEditor";
import HoroscopeSummary from "@/components/HoroscopeSummary";
import DatePicker from "@/components/form/DatePicker";
import TimePicker from "@/components/form/TimePicker";
import TownCombobox from "@/components/form/TownCombobox";
import {
  GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, MOTHER_TONGUE_OPTIONS, ACCOUNT_CREATED_BY_OPTIONS,
  RELIGION_OPTIONS, CASTE_OPTIONS, YES_NO_OPTIONS, YES_NO_SOMETIMES_OPTIONS,
  COUNTRY_OPTIONS, DISTRICT_OPTIONS, EDUCATION_OPTIONS, PROFESSION_OPTIONS, INCOME_OPTIONS,
  SIBLINGS_OPTIONS, FOOD_OPTIONS, HOBBY_OPTIONS, HEIGHT_OPTIONS, TOWNS_BY_DISTRICT,
  ETHNICITY_OPTIONS, HOROSCOPE_MATCHING_OPTIONS, PARENT_PROFESSION_OPTIONS,
} from "@/lib/profile-options";

// ---------- Form data ----------

type Form = {
  about_me_en: string; about_me_si: string; about_me_ta: string;
  first_name: string; middle_name: string; last_name: string; phone: string; phone_country: string; gender: string; age: string; civil_status: string; mother_tongue: string; account_created_by: string;
  religion: string; caste: string; horoscope: string; horoscope_matching: string; birth_date: string; birth_time: string; birth_place: string;
  country: string; district: string; city: string;
  education: string; job_title: string; income: string;
  father_ethnicity: string; father_religion: string; father_caste: string; father_job: string; father_country: string; father_info: string;
  mother_ethnicity: string; mother_religion: string; mother_caste: string; mother_job: string; mother_country: string; mother_info: string;
  siblings: string;
  height: string; weight: string; food_preference: string; drinking: string; smoking: string; differently_abled: string;
  hobbies: string[];
};
type FieldKey = keyof Form;

const EMPTY_FORM: Form = {
  about_me_en: "", about_me_si: "", about_me_ta: "",
  first_name: "", middle_name: "", last_name: "", phone: "", phone_country: DEFAULT_PHONE_COUNTRY, gender: "", age: "", civil_status: "", mother_tongue: "", account_created_by: "",
  religion: "", caste: "", horoscope: "", horoscope_matching: "", birth_date: "", birth_time: "", birth_place: "",
  country: "", district: "", city: "",
  education: "", job_title: "", income: "",
  father_ethnicity: "", father_religion: "", father_caste: "", father_job: "", father_country: "", father_info: "",
  mother_ethnicity: "", mother_religion: "", mother_caste: "", mother_job: "", mother_country: "", mother_info: "",
  siblings: "",
  height: "", weight: "", food_preference: "", drinking: "", smoking: "", differently_abled: "",
  hobbies: [],
};

type StepId = "basic" | "religion" | "location" | "career" | "family" | "lifestyle" | "photo" | "review";

const STEPS: { id: StepId; icon: React.ReactNode; fields: FieldKey[] }[] = [
  { id: "basic", icon: <User className="h-4 w-4" />, fields: ["first_name", "middle_name", "last_name", "phone", "gender", "age", "civil_status", "mother_tongue", "account_created_by", "about_me_en", "about_me_si", "about_me_ta"] },
  { id: "religion", icon: <Star className="h-4 w-4" />, fields: ["religion", "caste", "horoscope_matching", "birth_date", "birth_time", "birth_place"] },
  { id: "location", icon: <MapPin className="h-4 w-4" />, fields: ["country", "district", "city"] },
  { id: "career", icon: <GraduationCap className="h-4 w-4" />, fields: ["education", "job_title", "income"] },
  { id: "family", icon: <Users className="h-4 w-4" />, fields: [
    "father_ethnicity", "father_religion", "father_caste", "father_job", "father_info",
    "mother_ethnicity", "mother_religion", "mother_caste", "mother_job", "mother_info",
    "siblings",
  ] },
  { id: "lifestyle", icon: <Heart className="h-4 w-4" />, fields: ["height", "weight", "food_preference", "drinking", "smoking", "differently_abled", "hobbies"] },
  { id: "photo", icon: <Camera className="h-4 w-4" />, fields: [] },
  { id: "review", icon: <ClipboardCheck className="h-4 w-4" />, fields: [] },
];

const ALL_FIELDS = STEPS.flatMap((s) => s.fields);

// 🔒 මේ fields save වෙන්නේ "profile_private" table එකේ — ඒ user ට විතරයි බලන්න පුළුවන් (අනිත් අයට කවදාවත් පේන්නේ නෑ)
const PRIVATE_FIELDS: FieldKey[] = ["phone", "birth_date", "birth_time", "birth_place"];
const PUBLIC_FIELDS = ALL_FIELDS.filter((k) => !PRIVATE_FIELDS.includes(k));
const isFilled = (v: string | string[]) => (Array.isArray(v) ? v.length > 0 : v.trim() !== "");

// Database row එක → form එක
// "New User" වගේ auto දාපු නම් ඇත්ත නමක් නෙවෙයි — form එකේ පෙන්නන්නේ නෑ
const PLACEHOLDER_NAMES = ["new user", "user"];

function rowToForm(row: Record<string, unknown> | null): Form {
  if (!row) return { ...EMPTY_FORM };
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const phone = parsePhone(str(row.phone));
  const form = {
    ...EMPTY_FORM,
    ...Object.fromEntries(ALL_FIELDS.filter((k) => k !== "hobbies").map((k) => [k, str(row[k])])),
    phone: phone.national,
    phone_country: phone.iso,
    weight: str(row.weight).replace(/[^\d.]/g, ""), // "70kg" → "70"
    birth_time: str(row.birth_time).slice(0, 5), // "06:46:00" → "06:46"
    hobbies: str(row.hobbies).split(",").map((h) => h.trim()).filter(Boolean),
  } as Form;

  // පරණ profiles වල first/last name නැත්නම් full_name එකෙන් බෙදනවා
  const fullName = str(row.full_name).trim();
  if (!form.first_name && fullName && !PLACEHOLDER_NAMES.includes(fullName.toLowerCase())) {
    const parts = fullName.split(/\s+/);
    form.first_name = parts[0] ?? "";
    if (parts.length >= 3) form.middle_name = parts.slice(1, -1).join(" ");
    if (parts.length >= 2) form.last_name = parts[parts.length - 1];
  }
  if (PLACEHOLDER_NAMES.includes(form.first_name.trim().toLowerCase())) form.first_name = "";
  return form;
}

// Form එකේ කොටසක් → database එකට යවන විදිහට
function toPayload(form: Form, keys: FieldKey[]) {
  const out: Record<string, string | number | null> = {};
  for (const k of keys) {
    if (k === "hobbies") out.hobbies = form.hobbies.length ? form.hobbies.join(", ") : null;
    else if (k === "age" || k === "siblings") out[k] = form[k] === "" ? null : Number(form[k]);
    else if (k === "weight") out.weight = form.weight === "" ? null : `${form.weight}kg`;
    else if (k === "phone") out.phone = normalizePhone(form.phone_country, form.phone);
    else out[k] = form[k].trim() === "" ? null : form[k].trim();
  }
  // නමේ කොටසක් වෙනස් වුණොත් full_name එකත් අලුත් කරනවා (site එකේ අනිත් තැන්වල පේන්නේ ඒක)
  if (keys.some((k) => k === "first_name" || k === "middle_name" || k === "last_name")) {
    out.full_name = [form.first_name, form.middle_name, form.last_name].map((x) => x.trim()).filter(Boolean).join(" ") || null;
  }
  // කේන්දර ගැලපීම "Required" නම් විතරයි උපන් විස්තර තියාගන්නේ. පරණ "horoscope" (Yes/No) column එකත් ඒකෙන්ම හැදෙනවා.
  if (keys.includes("horoscope_matching")) {
    out.horoscope = form.horoscope_matching === "Required" ? "Yes" : form.horoscope_matching ? "No" : null;
    if (form.horoscope_matching !== "Required") {
      out.birth_date = null; out.birth_time = null; out.birth_place = null;
    }
  }
  // Sri Lanka නෙවෙයි නම් district එකක් ඕන නෑ
  if (keys.includes("country") && form.country !== "Sri Lanka") out.district = null;
  return out;
}

// ---------- Component ----------

export default function ProfileWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t, lang } = useLang();
  const [aboutLang, setAboutLang] = useState<"en" | "si" | "ta">(lang === "si" || lang === "ta" ? lang : "en"); // "මා ගැන" tab එක
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null); // "මගේ පැතිකඩ පෙරදසුන"
  const previewAvatar = useRef<string | null>(null);
  const [agreeTrue, setAgreeTrue] = useState(false); // 👈 Publish කරන්න කලින්: විස්තර සත්‍ය බවට + නියමයන්ට එකඟද
  const [agreeError, setAgreeError] = useState(false);
  const agreeRef = useRef<HTMLLabelElement>(null);
  const [reviewPhotos, setReviewPhotos] = useState<{ main: string | null; extras: string[] } | null>(null); // සමාලෝචනයේ photos
  const tr = useTr();
  const { showAlert, showConfirm } = useDialog();
  const W = t.wizard;
  const P = t.profile;
  const PB = t.publish;
  const A = t.auth;

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // ✅ Admin තහවුරු කළාද
  const [publishing, setPublishing] = useState(false);
  const [customTown, setCustomTown] = useState(false); // නගරය list එකේ නැත්නම් type කරන්න
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false); // Photo එක upload වෙනකම් ඉස්සරහට යන්න දෙන්නේ නෑ
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [finishState, setFinishState] = useState<"idle" | "saving" | "done">("idle"); // "වෙනස්කම් සුරකින්න" එකට
  const photoBusy = profilePhotoBusy || galleryBusy;
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const dirty = useRef<Set<FieldKey>>(new Set());
  const [hasChanges, setHasChanges] = useState(false); // 👈 Save කරන්න වෙනස්කම් තියෙනවද (නැත්නම් button එක disable)
  const topRef = useRef<HTMLDivElement>(null);

  // දැනට තියෙන profile details load කරනවා
  useEffect(() => {
    let active = true;
    supabase
      .from("profiles")
      .select(["avatar_url", "is_published", "full_name", "id_verified", ...PUBLIC_FIELDS].join(", "))
      .eq("id", userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) showAlert({ title: W.saveError, message: error.message, tone: "error" });
        // 🔒 Private details (phone, උපන් විස්තර) වෙනම table එකෙන්
        const { data: priv } = await supabase
          .from("profile_private")
          .select(PRIVATE_FIELDS.join(", "))
          .eq("user_id", userId)
          .maybeSingle();
        if (!active) return;
        const row = data
          ? { ...(data as unknown as Record<string, unknown>), ...((priv as unknown as Record<string, unknown> | null) ?? {}) }
          : null;
        const loaded = rowToForm(row);
        // "ගිණුම සෑදුවේ" default එක "තමන් විසින්"
        if (!loaded.account_created_by) { loaded.account_created_by = "Self"; dirty.current.add("account_created_by"); }
        // "විශේෂ අවශ්‍යතා" default එක "නැත"
        if (!loaded.differently_abled) { loaded.differently_abled = "No"; dirty.current.add("differently_abled"); }
        // full_name එකෙන් බෙදපු නම් අලුත් columns වලට save වෙන්න
        if (row && !row.first_name && loaded.first_name) {
          dirty.current.add("first_name");
          dirty.current.add("middle_name");
          dirty.current.add("last_name");
        }
        setHasPhoto(!!row?.avatar_url);
        setIsPublished(!!row?.is_published);
        setIsVerified(row?.id_verified === "Yes");

        // Register වෙනකොට දාපු phone number එක (Google / email) profile එකේ නැත්නම් ඒකෙන් පුරවනවා
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!active) return;
          const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
          if (!loaded.phone && meta.phone) {
            const p = parsePhone(meta.phone);
            loaded.phone = p.national;
            loaded.phone_country = p.iso;
            dirty.current.add("phone");
          }
          // Google එකෙන් ආපු නම
          if (!loaded.first_name && meta.given_name) { loaded.first_name = meta.given_name; dirty.current.add("first_name"); }
          if (!loaded.last_name && meta.family_name) { loaded.last_name = meta.family_name; dirty.current.add("last_name"); }
          setForm(loaded);
          setHasChanges(dirty.current.size > 0); // Auto පුරවපු values save කරන්න ඕන නම්
          setLoading(false);
        });
      });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  const set = (key: FieldKey, value: string | string[]) => {
    setForm((f) => ({ ...f, [key]: value }));
    dirty.current.add(key);
    setHasChanges(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // 🌐 "මා ගැන" English → සිංහල / දෙමළ auto translate (ලියලා තත්පර 1.5කට පස්සේ). අතින් ලිව්ව ඒවා override කරන්නේ නෑ
  const [autoFilled, setAutoFilled] = useState<{ si: boolean; ta: boolean }>({ si: false, ta: false });
  const [translating, setTranslating] = useState(false);
  const aboutEn = form.about_me_en;
  useEffect(() => {
    const text = aboutEn.trim();
    const want = ([["si", form.about_me_si], ["ta", form.about_me_ta]] as const).filter(([l, v]) => !v.trim() || autoFilled[l]).map(([l]) => l);
    if (text.length < 3 || !want.length) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      setTranslating(true);
      const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, to: want }) }).catch(() => null);
      const d = res && res.ok ? await res.json() : null;
      if (!cancelled && d) {
        for (const l of want) if (d[l]) set(`about_me_${l}` as FieldKey, String(d[l]).slice(0, 600));
        setAutoFilled((a) => ({ ...a, ...Object.fromEntries(want.map((l) => [l, true])) }));
      }
      if (!cancelled) setTranslating(false);
    }, 1500);
    return () => { cancelled = true; clearTimeout(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aboutEn]);

  // සම්පූර්ණ වුණු ප්‍රතිශතය (photo එකත් එක්ක)
  const percent = useMemo(() => {
    // Optional fields (මැද නම, අමතර තොරතුරු) සහ අදාළ නැති fields ගණන් ගන්නේ නෑ
    const counted = ALL_FIELDS.filter((k) => isRelevant(k, form) && !isOptionalField(k));
    const filled = counted.filter((k) => isFilled(form[k])).length + (hasPhoto ? 1 : 0);
    return Math.round((filled / (counted.length + 1)) * 100);
  }, [form, hasPhoto]);

  // 👇 සමාලෝචනය පියවරට ආපු ගමන් photos අරගන්නවා ("පෙරදසුන" ඒ ගමන්ම open වෙන්නත්, photos පොඩියට පෙන්නන්නත්)
  useEffect(() => {
    if (STEPS[step]?.id !== "review") return;
    let active = true;
    Promise.all([
      fetch("/api/avatar/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/photos?userId=${userId}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([me, gallery]) => {
      if (!active) return;
      previewAvatar.current = me?.originalUrl ?? null;
      setReviewPhotos({ main: me?.originalUrl ?? null, extras: (gallery?.photos ?? []).map((p: { url: string }) => p.url) });
    });
    return () => { active = false; };
  }, [step, userId]);

  // 👇 හැම පියවරකම තවම පුරවලා නැති fields (optional ඒවා නැතුව)
  const missingByStep = useMemo(
    () =>
      STEPS.map((s, i) => {
        if (s.id === "photo") return { i, fields: hasPhoto ? [] : ["photo"] };
        const fields = s.fields.filter((k) => isRelevant(k, form) && !isOptionalField(k) && !isFilled(form[k]));
        return { i, fields: fields as string[] };
      }).filter((m) => m.fields.length > 0),
    [form, hasPhoto]
  );

  const stepDone = (i: number) => {
    const s = STEPS[i];
    if (s.id === "photo") return hasPhoto;
    if (s.id === "review") return false;
    return s.fields.some((k) => isFilled(form[k]));
  };

  // 🎯 පළමු වැරැද්ද තියෙන field එකට scroll කරලා focus කරනවා (උදා: වයස උපන් දිනයට ගැළපෙන්නේ නෑ)
  const scrollToFirstError = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>("[data-field-error]");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.querySelector<HTMLElement>("input, textarea, button, [tabindex]")?.focus({ preventScroll: true });
    }));
  };

  const validate = (i: number, show = true) => {
    const e: Partial<Record<FieldKey, string>> = {};
    const id = STEPS[i].id;
    if (id === "religion") {
      if (!form.horoscope_matching) e.horoscope_matching = W.required;
      if (form.horoscope_matching === "Required") {
        if (!form.birth_date) e.birth_date = W.required;
        // 👇 උපන් දිනයෙන් ගණනය කරන වයස, "මූලික තොරතුරු" එකේ දාපු වයසට ගැළපෙනවද
        else if (form.age) {
          const dob = new Date(form.birth_date + "T00:00:00");
          const now = new Date();
          let dobAge = now.getFullYear() - dob.getFullYear();
          if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) dobAge -= 1;
          if (dobAge !== Number(form.age)) e.birth_date = t.extra.ageMismatch.replace("{age}", form.age).replace("{dobAge}", String(dobAge));
        }
        if (!form.birth_time) e.birth_time = W.required;
        if (!form.birth_place.trim()) e.birth_place = W.required;
      }
    }
    if (id === "lifestyle" && !form.height) e.height = W.required;
    if (id !== "basic") {
      if (show) { setErrors(e); if (Object.keys(e).length) scrollToFirstError(); }
      return Object.keys(e).length === 0;
    }
    if (!form.first_name.trim()) e.first_name = W.required;
    if (!form.last_name.trim()) e.last_name = W.required;
    if (!form.phone.trim()) e.phone = W.required;
    else if (!normalizePhone(form.phone_country, form.phone)) e.phone = form.phone_country === "LK" ? A.errPhone : A.errPhoneGeneric;
    if (!form.gender) e.gender = W.required;
    if (!form.civil_status) e.civil_status = W.required;
    if (!form.mother_tongue) e.mother_tongue = W.required;
    const age = Number(form.age);
    if (!form.age) e.age = W.required;
    else if (!Number.isFinite(age) || age < 18 || age > 80) e.age = W.ageError;
    if (show) { setErrors(e); if (Object.keys(e).length) scrollToFirstError(); }
    return Object.keys(e).length === 0;
  };

  // දැනට ඉන්න පියවරේ වෙනස් කරපු details save කරනවා
  const saveCurrent = async () => {
    const keys = STEPS[step].fields.filter((k) => dirty.current.has(k));
    if (keys.length === 0) return true;

    setSaving(true);
    const payload = toPayload(form, keys);
    // 🔒 Private fields එක table එකකට, අනිත් ඒවා profiles එකට
    const privatePart: Record<string, unknown> = {};
    const publicPart: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      (PRIVATE_FIELDS.includes(k as FieldKey) ? privatePart : publicPart)[k] = v;
    }

    let errorMessage: string | undefined;
    if (Object.keys(publicPart).length) {
      const { data, error } = await supabase.from("profiles").update(publicPart).eq("id", userId).select("id");
      errorMessage = error?.message;
      // Profile row එක තාම නැත්නම් (අලුත් account) අලුතින් හදනවා
      if (!error && (!data || data.length === 0)) {
        const { error: insertError } = await supabase.from("profiles").insert({ id: userId, ...publicPart });
        errorMessage = insertError?.message;
      }
    }
    if (!errorMessage && Object.keys(privatePart).length) {
      const { error } = await supabase.from("profile_private").upsert({ user_id: userId, ...privatePart }, { onConflict: "user_id" });
      errorMessage = error?.message;
    }
    setSaving(false);

    if (errorMessage) {
      showAlert({ title: W.saveError, message: errorMessage, tone: "error" });
      return false;
    }
    keys.forEach((k) => dirty.current.delete(k));
    setHasChanges(dirty.current.size > 0);
    if (keys.some((k) => k.endsWith("_name"))) window.dispatchEvent(new Event("avatar-updated")); // navbar එකේ නම අලුත් කරන්න
    window.dispatchEvent(new Event("profile-updated")); // match % ආයේ ගණනය කරන්න
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
    return true;
  };

  const goTo = async (target: number) => {
    if (target === step || saving || photoBusy) return;
    if (target > step && !validate(step)) return;
    if (!(await saveCurrent())) return;
    setStep(target);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Publish කරන්න අවම වශයෙන් නම, ස්ත්‍රී/පුරුෂ භාවය, වයස ඕන
  const basicsComplete = () => {
    const age = Number(form.age);
    return (
      !!form.first_name.trim() && !!form.last_name.trim() && !!normalizePhone(form.phone_country, form.phone) &&
      !!form.gender && age >= 18 && age <= 80 && !!form.civil_status && !!form.mother_tongue
    );
  };

  // 👇 Profile එක publish කරනවා — ඊට පස්සේ තමයි Browse එකේ අනිත් අයට පේන්නේ
  const publish = async () => {
    if (!(await saveCurrent())) return;
    // අනිවාර්ය fields නැති පළවෙනි පියවරට යවනවා
    const firstMissing = STEPS.findIndex((_, i) => !validate(i, false));
    if (!basicsComplete() || firstMissing !== -1) {
      const target = firstMissing === -1 ? 0 : firstMissing;
      await showAlert({ title: PB.needBasics, tone: "default" });
      setStep(target);
      validate(target);
      return;
    }
    if (!agreeTrue) {
      // 👇 Tick කරලා නැත්නම්: ඒ කොටුවට scroll කරලා, රතු පාටින් දිලිස්සලා, message එකක්
      setAgreeError(true);
      agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      await showAlert({ title: t.extra.publishNeedsConfirm, tone: "default" });
      return;
    }
    setPublishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_published: true, published_at: new Date().toISOString(), terms_accepted_at: new Date().toISOString() })
      .eq("id", userId);
    setPublishing(false);
    if (error) return showAlert({ title: W.saveError, message: error.message, tone: "error" });

    setIsPublished(true);
    await showAlert({ title: PB.publishedTitle, message: PB.publishedMsg, tone: "success", confirmText: W.startBrowsing, icon: <Sparkles className="h-7 w-7" /> });
    router.push("/browse");
  };

  const hideProfile = async () => {
    const ok = await showConfirm({ title: PB.hideConfirmTitle, message: PB.hideConfirmMsg, confirmText: PB.hideProfile, tone: "danger" });
    if (!ok) return;
    const { error } = await supabase.from("profiles").update({ is_published: false }).eq("id", userId);
    if (error) return showAlert({ title: W.saveError, message: error.message, tone: "error" });
    setIsPublished(false);
  };

  // දැනටමත් publish කරලා නම් අන්තිම button එකෙන් save කරනවා විතරයි
  // 👇 අනිත් අයට පේන විදිහටම මගේ profile එක (ProfileModal එකෙන්)
  const openPreview = () => {
    const name = [form.first_name, form.middle_name, form.last_name].map((x) => x.trim()).filter(Boolean).join(" ");
    setPreview({
      ...form,
      id: userId,
      full_name: name,
      age: form.age ? Number(form.age) : null,
      weight: form.weight ? `${form.weight}kg` : null,
      hobbies: form.hobbies.join(", "),
      avatar_url: previewAvatar.current,
      isBlurred: false,
      interestStatus: "accepted",
      last_seen_at: new Date().toISOString(),
      // 👇 සමාලෝචනයේ load වෙලා තියෙන photos ඒ ගමන්ම (නැත්නම් popup එකේ skeleton එක පේනවා)
      ...(reviewPhotos ? { preview_photos: reviewPhotos.extras, photo_meta: { locked: false, count: reviewPhotos.extras.length } } : {}),
    });
    // Photo link එක තාම නැත්නම් popup එක open කරලාම පස්සේ දානවා (බලන් ඉන්න ඕන නෑ)
    if (!previewAvatar.current) {
      fetch("/api/avatar/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          previewAvatar.current = d?.originalUrl ?? null;
          setPreview((p) => (p ? { ...p, avatar_url: previewAvatar.current } : p));
        })
        .catch(() => {});
    }
  };

  // 👇 Spinner → ✓ සුරැකුණා → Browse page එකට
  const finish = async () => {
    setFinishState("saving");
    const started = Date.now();
    const ok = await saveCurrent();
    if (!ok) return setFinishState("idle");
    // Save එක ඉක්මනට ඉවර වුණත් spinner එක ටිකක් පේන්න (user ට වැඩේ වුණා කියලා තේරෙන්න)
    const wait = Math.max(0, 500 - (Date.now() - started));
    setTimeout(() => {
      setFinishState("done");
      setTimeout(() => router.push("/browse"), 1200);
    }, wait);
  };

  // ---------- Field helpers ----------

  const select = (key: FieldKey, label: string, options: string[], opts: { translate?: boolean; required?: boolean } = {}) => (
    <Field label={label} error={errors[key]} required={opts.required}>
      {/* 👇 Site එකට ගැලපෙන dropdown එක (browser default <select> එක නෙවෙයි) */}
      <Dropdown
        fullWidth
        value={form[key] as string}
        onChange={(v) => set(key, v)}
        placeholder={W.select}
        invalid={!!errors[key]}
        ariaLabel={label}
        options={[
          ...(opts.required ? [] : [{ value: "", label: W.select }]),
          ...options.map((o) => ({ value: o, label: opts.translate === false ? o : String(tr(o)) })),
        ]}
      />
    </Field>
  );

  const chips = (key: FieldKey, label: string, options: string[], required = false) => (
    <Field label={label} error={errors[key]} required={required}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = form[key] === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => set(key, active ? "" : o)}
              aria-pressed={active}
              className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize transition ${
                active
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                  : "border-border bg-muted/30 text-foreground hover:border-primary/50"
              }`}
            >
              {String(tr(o))}
            </button>
          );
        })}
      </div>
    </Field>
  );

  const text = (key: FieldKey, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, extra: { required?: boolean; hint?: string } = {}) => (
    <Field label={label} error={errors[key]} required={extra.required} hint={extra.hint}>
      <input
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        className={`w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${errors[key] ? "border-red-500" : "border-border focus:border-primary"}`}
        {...props}
      />
    </Field>
  );

  // ---------- Steps ----------

  const current = STEPS[step];
  const stepTitle = W[current.id];
  const stepDesc = W[`${current.id}Desc` as const];

  const renderStep = () => {
    switch (current.id) {
      case "basic":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            {/* 👇 නම කොටස් 3කට: මුල් නම* / මැද නම (optional) / වාසගම* */}
            <div className="grid gap-5 md:col-span-2 md:grid-cols-3">
              {text("first_name", W.firstName, { placeholder: W.firstNamePlaceholder, autoComplete: "given-name" }, { required: true })}
              {text("middle_name", W.middleName, { autoComplete: "additional-name" }, { hint: W.optional })}
              {text("last_name", W.lastName, { placeholder: W.lastNamePlaceholder, autoComplete: "family-name" }, { required: true })}
            </div>
            <div className="md:col-span-2">
              <Field label={A.phone} error={errors.phone} required>
                <PhoneInput
                  country={form.phone_country}
                  number={form.phone}
                  invalid={!!errors.phone}
                  onChange={(country, number) => {
                    setForm((f) => ({ ...f, phone_country: country, phone: number }));
                    dirty.current.add("phone");
                    setHasChanges(true);
                    if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                />
              </Field>
            </div>
            {chips("gender", P.gender, GENDER_OPTIONS, true)}
            {text("age", W.age, { type: "number", inputMode: "numeric", min: 18, max: 80, placeholder: "18 - 80" }, { required: true })}
            {select("civil_status", P.maritalStatus, MARITAL_STATUS_OPTIONS, { required: true })}
            {select("mother_tongue", P.motherTongue, MOTHER_TONGUE_OPTIONS, { required: true })}
            <div className="md:col-span-2">{chips("account_created_by", P.accountCreatedBy, ACCOUNT_CREATED_BY_OPTIONS)}</div>

            {/* 👇 මා ගැන — EN / සිං / த tabs, එකකින් හෝ තුනෙන්ම ලියන්න පුළුවන් */}
            <div className="md:col-span-2">
              <Field label={W.aboutTitle} hint={W.optional}>
                <p className="-mt-1 mb-3 text-xs text-muted-foreground">{W.aboutHint}</p>
                <div className="overflow-hidden rounded-xl border border-border bg-muted/30 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <div className="flex border-b border-border">
                    {(["en", "si", "ta"] as const).map((l) => {
                      const key = `about_me_${l}` as FieldKey;
                      const active = aboutLang === l;
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setAboutLang(l)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition ${active ? "bg-background text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {l === "en" ? "English" : l === "si" ? "සිංහල" : "தமிழ்"}
                          {(form[key] as string).trim() && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={form[`about_me_${aboutLang}` as FieldKey] as string}
                    onChange={(e) => {
                      set(`about_me_${aboutLang}` as FieldKey, e.target.value);
                      // 👇 සිංහල / දෙමළ අතින් වෙනස් කළොත් ඒක ආයේ auto translate කරලා override කරන්නේ නෑ
                      if (aboutLang !== "en") setAutoFilled((a) => ({ ...a, [aboutLang]: false }));
                    }}
                    maxLength={600}
                    rows={4}
                    placeholder={W.aboutPlaceholder}
                    className="block w-full resize-y bg-transparent px-4 py-3 text-sm outline-none"
                  />
                  <div className="flex items-center justify-between gap-3 px-4 pb-2 text-xs text-muted-foreground">
                    {/* 🌐 English එකෙන් ලිව්වාම සිංහල / දෙමළ ඉබේම */}
                    <span className="flex items-center gap-1.5">
                      {translating ? <><Loader2 className="h-3 w-3 animate-spin" /> {W.aboutTranslating}</> : (autoFilled.si || autoFilled.ta) ? <span className="text-primary">🌐 {W.aboutAutoNote}</span> : aboutLang === "en" ? <span>🌐 {W.aboutAutoHint}</span> : null}
                    </span>
                    <span>{(form[`about_me_${aboutLang}` as FieldKey] as string).length} / 600</span>
                  </div>
                </div>
              </Field>
            </div>
          </div>
        );
      case "religion":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            {select("religion", P.religion, RELIGION_OPTIONS)}
            {select("caste", P.caste, CASTE_OPTIONS)}

            {/* 👇 කේන්දර ගැලපීම අනිවාර්යයි. "අත්‍යවශ්‍යයි" නම් විතරයි උපන් විස්තර අහන්නේ */}
            <div className="md:col-span-2">
              <Field label={W.horoscopeMatching} hint={W.horoscopeMatchingHint} error={errors.horoscope_matching} required>
                <div className="flex flex-wrap gap-2">
                  {HOROSCOPE_MATCHING_OPTIONS.map((o) => {
                    const active = form.horoscope_matching === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        aria-pressed={active}
                        onClick={() => set("horoscope_matching", o)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          active ? "border-primary bg-primary text-white shadow-md shadow-primary/20" : "border-border bg-muted/30 hover:border-primary/50"
                        }`}
                      >
                        {String(tr(o))}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            {form.horoscope_matching === "Required" && (
              <div className="md:col-span-2 rounded-2xl border border-primary/25 bg-primary/5 p-5">
                {/* 🔒 Privacy පොරොන්දුව */}
                <p className="mb-5 flex items-start gap-2 rounded-xl bg-background/60 p-3 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {W.horoscopePrivacy}
                </p>

                <div className="grid gap-5 md:grid-cols-3">
                  <Field label={W.birthDate} error={errors.birth_date} required>
                    <DatePicker value={form.birth_date} onChange={(v) => set("birth_date", v)} invalid={!!errors.birth_date} />
                  </Field>
                  <Field label={W.birthTime} error={errors.birth_time} required>
                    <TimePicker value={form.birth_time} onChange={(v) => set("birth_time", v)} invalid={!!errors.birth_time} />
                  </Field>
                  <Field label={W.birthPlace} error={errors.birth_place} required>
                    <TownCombobox value={form.birth_place} onChange={(v) => set("birth_place", v)} invalid={!!errors.birth_place} />
                  </Field>
                </div>
                {/* 🔮 මගේ කේන්දරය — මෙතනින්ම (උඩ උපන් විස්තර වලින්) සාදලා, අතින් හදලා, සුරකින්න */}
                <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                  <p className="mb-3 flex items-center gap-2 font-bold"><Star className="h-4 w-4 text-primary" /> {t.horo.title}</p>
                  <HoroscopeEditor embedded={{ date: form.birth_date, time: form.birth_time, place: form.birth_place }} />
                </div>
              </div>
            )}
          </div>
        );
      case "location": {
        const isSriLanka = form.country === "Sri Lanka";
        const towns = TOWNS_BY_DISTRICT[form.district] ?? [];
        const showTownInput = !isSriLanka || customTown || (!!form.city && !towns.includes(form.city));
        return (
          <div className="grid gap-5 md:grid-cols-2">
            {select("country", W.country, COUNTRY_OPTIONS)}

            {isSriLanka && (
              <Field label={W.district}>
                <Dropdown
                  fullWidth
                  value={form.district}
                  placeholder={W.select}
                  ariaLabel={W.district}
                  onChange={(v) => {
                    // දිස්ත්‍රික්කය මාරු කළාම කලින් තෝරපු නගරය අයින් කරනවා
                    set("district", v);
                    set("city", "");
                    setCustomTown(false);
                  }}
                  options={DISTRICT_OPTIONS.map((d) => ({ value: d, label: String(tr(d)) }))}
                />
              </Field>
            )}

            {/* 👇 ශ්‍රී ලංකාවේ නම්: දිස්ත්‍රික්කයට අදාළ නගර list එක. List එකේ නැත්නම් "වෙනත්" තෝරලා type කරන්න */}
            {isSriLanka && (
              <Field label={W.city}>
                <Dropdown
                  fullWidth
                  value={showTownInput ? "__other" : form.city}
                  disabled={!form.district}
                  placeholder={form.district ? W.select : W.selectDistrictFirst}
                  ariaLabel={W.city}
                  onChange={(v) => {
                    if (v === "__other") { setCustomTown(true); set("city", ""); }
                    else { setCustomTown(false); set("city", v); }
                  }}
                  options={[...towns.map((town) => ({ value: town, label: String(tr(town)) })), { value: "__other", label: W.otherTown }]}
                />
              </Field>
            )}

            {showTownInput && (!isSriLanka || form.district) && (
              <div className={isSriLanka ? "md:col-start-2" : ""}>
                {text("city", isSriLanka ? W.otherTown : W.city, { placeholder: W.cityPlaceholder, autoFocus: isSriLanka })}
              </div>
            )}
          </div>
        );
      }
      case "career":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            {select("education", P.education, EDUCATION_OPTIONS)}
            {select("job_title", P.profession, PROFESSION_OPTIONS)}
            {select("income", P.income, INCOME_OPTIONS)}
          </div>
        );
      case "family": {
        // පියා / මව එකම පේළියේ — කොටු අඩුයි, සසඳන්නත් ලේසියි
        const rows: { key: string; label: string; options?: string[]; text?: boolean }[] = [
          { key: "ethnicity", label: W.ethnicity, options: ETHNICITY_OPTIONS },
          { key: "religion", label: P.religion, options: RELIGION_OPTIONS },
          { key: "caste", label: P.caste, options: CASTE_OPTIONS },
          { key: "job", label: P.profession, options: PARENT_PROFESSION_OPTIONS },
          { key: "info", label: W.additionalInfo, text: true },
        ];
        const bareSelect = (key: FieldKey, options: string[], aria: string) => (
          <Dropdown
            fullWidth
            value={form[key] as string}
            onChange={(v) => set(key, v)}
            placeholder={W.select}
            ariaLabel={aria}
            options={[{ value: "", label: W.select }, ...options.map((o) => ({ value: o, label: String(tr(o)) }))]}
          />
        );
        const bareText = (key: FieldKey, aria: string) => (
          <input
            value={form[key] as string}
            onChange={(e) => set(key, e.target.value)}
            aria-label={aria}
            maxLength={120}
            placeholder={W.additionalInfoPlaceholder}
            className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        );
        // "පියාට සමානයි" — ජාතිය, ආගම, කුලය, වෘත්තිය මවට copy කරනවා
        const copyFromFather = () => {
          (["ethnicity", "religion", "caste", "job"] as const).forEach((k) => {
            const v = form[`father_${k}` as FieldKey] as string;
            if (v) set(`mother_${k}` as FieldKey, v);
          });
        };

        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* Header */}
              <div className="grid grid-cols-2 items-center gap-3 border-b border-border bg-muted/30 px-4 py-3 md:grid-cols-[150px_1fr_1fr]">
                <span className="hidden md:block" />
                <span className="text-sm font-bold leading-8 text-primary">{W.father}</span>
                <span className="flex items-center justify-between gap-2 text-sm font-bold leading-8 text-primary">
                  {W.mother}
                  <button type="button" onClick={copyFromFather} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-normal leading-4 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary">
                    <Copy className="h-3.5 w-3.5" /> {W.sameAsFather}
                  </button>
                </span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-border/60">
                {rows.map((r) => (
                  <div key={r.key} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[150px_1fr_1fr]">
                    <span className="col-span-2 text-sm font-semibold text-foreground md:col-span-1">
                      {r.label}
                      {r.text && <span className="ml-1 text-xs font-normal text-muted-foreground">({W.optional})</span>}
                    </span>
                    {(["father", "mother"] as const).map((who) => {
                      const key = `${who}_${r.key}` as FieldKey;
                      const aria = `${who === "father" ? W.father : W.mother} – ${r.label}`;
                      return <div key={who}>{r.text ? bareText(key, aria) : bareSelect(key, r.options!, aria)}</div>;
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 md:pr-2.5">{select("siblings", P.siblings, SIBLINGS_OPTIONS, { translate: false })}</div>
          </div>
        );
      }
      case "lifestyle":
        return (
          <div className="grid gap-5 md:grid-cols-2">
            {select("height", P.height, HEIGHT_OPTIONS, { translate: false, required: true })}
            {text("weight", W.weightKg, { type: "number", inputMode: "numeric", min: 30, max: 200, placeholder: "60" })}
            {chips("food_preference", P.food, FOOD_OPTIONS)}
            {chips("drinking", P.drinking, YES_NO_SOMETIMES_OPTIONS)}
            {chips("smoking", P.smoking, YES_NO_SOMETIMES_OPTIONS)}
            {chips("differently_abled", P.differentlyAbled, YES_NO_OPTIONS)}
            <div className="md:col-span-2">
              <Field label={W.hobbies} hint={W.hobbiesHint}>
                <div className="flex flex-wrap gap-2">
                  {HOBBY_OPTIONS.map((h) => {
                    const active = form.hobbies.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={active}
                        onClick={() => set("hobbies", active ? form.hobbies.filter((x) => x !== h) : [...form.hobbies, h])}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                        }`}
                      >
                        {/* 👇 හැම විනෝදාංශයකටම ගැලපෙන icon එකක්; තෝරලා නම් ✓ */}
                        {active ? <Check className="h-3.5 w-3.5" /> : <HobbyIcon hobby={h} className="h-3.5 w-3.5 opacity-70" />}
                        {String(tr(h))}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </div>
        );
      case "photo":
        return (
          <>
            <ProfilePhotoCard
              compact
              onBusyChange={setProfilePhotoBusy}
              onPhotoChange={(has) => setHasPhoto(has)}
            />
            {/* 👇 තවත් photos 4ක් දක්වා (accept කරපු අයට විතරයි පේන්නේ) */}
            <PhotoGalleryManager userId={userId} onBusyChange={setGalleryBusy} />
          </>
        );
      case "review":
        return (
          <div className="space-y-4">
            {/* 👇 Publish කරන්න පොළඹවන කොටස (publish කරලා නැත්නම්) */}
            {!isPublished && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="h-4 w-4" /> {PB.benefitsTitle}</h3>
                <ul className="space-y-2 text-sm text-foreground">
                  {[PB.benefit1, PB.benefit2, PB.benefit3].map((b) => (
                    <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {b}</li>
                  ))}
                </ul>
              </div>
            )}
            {STEPS.filter((s) => s.fields.length > 0).map((s) => (
              <div key={s.id} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-primary">{s.icon} {W[s.id]}</h3>
                  <button
                    type="button"
                    onClick={() => goTo(STEPS.findIndex((x) => x.id === s.id))}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {W.edit}
                  </button>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
                  {s.fields
                    .filter((k) => isRelevant(k, form))
                    .map((k) => (
                      // 👇 update-65: දිග අගයන් (උදා: විනෝදාංශ) "…" වෙලා කැපෙන්නේ නෑ — සම්පූර්ණ පළලට, පේළි කීපයකට
                      <div key={k} className={`min-w-0 ${k === "hobbies" ? "col-span-2 md:col-span-3" : ""}`}>
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{fieldLabel(k, W, P, A.phone)}</dt>
                        <dd className={`break-words text-sm font-semibold capitalize ${isFilled(form[k]) ? "" : "font-normal italic text-muted-foreground"}`}>
                          {displayValue(k, form, tr) || W.notSet}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}

            {/* 🔮 කේන්දරය දාලා නම් සාරාංශයක් */}
            <HoroscopeSummary onEdit={() => goTo(STEPS.findIndex((x) => x.id === "religion"))} />

            {/* 👇 ඡායාරූප — profile photo එක + අමතර photos පොඩියට */}
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-primary">{STEPS.find((x) => x.id === "photo")?.icon} {W.photo}</h3>
                <button type="button" onClick={() => goTo(STEPS.findIndex((x) => x.id === "photo"))} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
                  <Pencil className="h-3.5 w-3.5" /> {W.edit}
                </button>
              </div>
              {reviewPhotos === null ? (
                <div className="flex gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 w-20 animate-pulse rounded-xl bg-muted" />)}</div>
              ) : !reviewPhotos.main && reviewPhotos.extras.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">{W.notSet}</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {reviewPhotos.main && (
                    <div className="relative">
                      <AvatarImage src={reviewPhotos.main} shape="rounded-xl" className="h-20 w-20 ring-2 ring-primary" />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">★</span>
                    </div>
                  )}
                  {reviewPhotos.extras.map((u) => <AvatarImage key={u} src={u} shape="rounded-xl" className="h-20 w-20" />)}
                </div>
              )}
            </div>

            {/* ✅ තහවුරු වන්න (කැමති නම් දැන්ම, නැත්නම් පස්සේ) */}
            {!isVerified && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.extra.verifyTitle} <span className="font-normal text-muted-foreground">({W.optional})</span></p>
                    <p className="text-sm text-muted-foreground">{t.extra.notifGetVerified}</p>
                  </div>
                </div>
                <a href="/verify" target="_blank" rel="noopener" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{t.extra.getVerified}</a>
              </div>
            )}

            {/* 👇 Publish කරන්න කලින් එකඟතාවය (අලුත් profiles වලට විතරයි) */}
            {!isPublished && (
              <label ref={agreeRef} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 text-sm leading-relaxed text-foreground transition ${agreeError && !agreeTrue ? "animate-pulse border-red-500 bg-red-500/10" : "border-primary/30 bg-primary/5"}`}>
                <input type="checkbox" checked={agreeTrue} onChange={(e) => { setAgreeTrue(e.target.checked); setAgreeError(false); }} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#D52047]" />
                <span>
                  {t.extra.confirmTrue}{" "}
                  <a href="/terms" target="_blank" className="font-semibold text-primary hover:underline">{t.extra.termsLink}</a>
                </span>
              </label>
            )}

            {/* 👇 (යටින්ම) හැම පියවරකදීම save වෙන නිසා මෙතන "Save" එකක් ඕන නෑ කියලා පැහැදිලිව */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-500/25 bg-green-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400"><Check className="h-4 w-4 shrink-0" /> {W.allSaved}</p>
              <button type="button" onClick={openPreview} className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary">
                <Eye className="h-4 w-4" /> {W.previewProfile}
              </button>
            </div>

            {isPublished && (
              <button type="button" onClick={hideProfile} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-red-500">
                <EyeOff className="h-4 w-4" /> {PB.hideProfile}
              </button>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-96 animate-pulse rounded-3xl bg-muted/40" />
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div ref={topRef} className="profile-wizard w-full scroll-mt-24">
      {/* 👇 Wizard එකේ අකුරු එක ප්‍රමාණයක් ලොකු කරනවා — වැඩිහිටියන්ටත් පහසුවෙන් කියවන්න */}
      <style href="profile-wizard-text" precedence="default">
        {`.profile-wizard .text-xs{font-size:.875rem;line-height:1.35rem}
.profile-wizard .text-sm{font-size:1rem;line-height:1.6rem}
.profile-wizard .text-\[11px\],.profile-wizard .text-\[10px\]{font-size:.8rem}`}
      </style>
      {/* Header + progress */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-foreground">{W.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{W.subtitle}</p>
      </div>

      {/* 👇 Profile එක දැන් අනිත් අයට පේනවද නැද්ද කියලා පැහැදිලිව */}
      {isPublished ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400">{PB.liveTitle}</p>
            <p className="text-xs text-muted-foreground">{PB.liveMsg}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{PB.privateTitle}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{PB.privateMsg}</p>
          </div>
        </div>
      )}

      {/* ✅ තහවුරු කිරීමේ තත්ත්වය */}
      {/* (verify වෙලා නැත්නම් "තහවුරු වන්න" option එක සමාලෝචනය පියවරේ විතරයි) */}
      {!loading && isVerified && (
        <p className="-mt-3 mb-6 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <BadgeCheck className="h-5 w-5 fill-blue-500 text-white" /> {t.extra.statusApproved}
        </p>
      )}

      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
        <span className="text-muted-foreground">{W.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(STEPS.length))}</span>
        <span className="text-primary">{W.complete.replace("{p}", String(percent))}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-[#D52047] to-[#AD032A] transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      {/* 👇 100% කරන්න පොළඹවනවා + ඉතුරු පියවර click කරලා කෙලින්ම යන්න */}
      {/* 👇 "තවම ඉතුරු" කොටස — profile එක edit කරනකොට විතරයි (අලුතින් හදනකොට පියවරෙන් පියවර යන නිසා ඕන නෑ) */}
      {!isPublished && STEPS[step]?.id !== "review" ? null : percent >= 100 ? (
        <p className="mb-6 rounded-xl bg-green-500/10 px-4 py-3 text-base font-semibold text-green-700 dark:text-green-400">{W.allComplete}</p>
      ) : (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-base font-bold text-foreground"><Sparkles className="h-5 w-5 text-primary" /> {W.completeTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{W.completeMsg}</p>
          {missingByStep.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">{W.stillMissing}</span>
              {missingByStep.map(({ i, fields }) => (
                <button
                  key={STEPS[i].id}
                  type="button"
                  onClick={() => goTo(i)}
                  title={fields.map((f) => (f === "photo" ? W.photo : fieldLabel(f as FieldKey, W, P, A.phone))).join(", ")}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition [&>svg]:h-4 [&>svg]:w-4 ${
                    i === step ? "border-primary bg-primary text-white" : "border-primary/30 bg-background text-primary hover:bg-primary/10"
                  }`}
                >
                  {STEPS[i].icon} {W[STEPS[i].id]}
                  <span className={`rounded-full px-1.5 text-[10px] ${i === step ? "bg-white/20" : "bg-primary/10"}`}>{fields.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steps indicator: රවුම් 8ක් ඉරකින් සම්බන්ධ කරලා — හැම screen එකකටම ගැලපෙනවා (scroll වෙන්නේ නෑ) */}
      <nav aria-label="Profile steps" className="relative mb-8">
        {/* පිටිපස්සේ ඉර (මුල් රවුමේ මැද සිට අන්තිම රවුමේ මැද දක්වා) */}
        <div className="absolute top-[18px] h-0.5 rounded-full bg-border" style={{ left: `${50 / STEPS.length}%`, right: `${50 / STEPS.length}%` }} />
        {/* දැනට ඉන්න පියවර දක්වා පිරෙන ඉර */}
        <div
          className="absolute top-[18px] h-0.5 rounded-full bg-gradient-to-r from-[#D52047] to-[#AD032A] transition-all duration-500"
          style={{
            left: `${50 / STEPS.length}%`,
            width: `${(step / (STEPS.length - 1)) * (100 - 100 / STEPS.length)}%`,
          }}
        />

        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}>
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = stepDone(i);
            return (
              <li key={s.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  aria-label={W[s.id]}
                  title={W[s.id]}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 [&>svg]:h-4 [&>svg]:w-4 ${
                    active
                      ? "scale-110 border-primary bg-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/15"
                      : done
                        ? "border-green-500/60 bg-background text-green-600 hover:border-green-500 dark:text-green-400"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {done && !active ? <Check className="h-4 w-4" /> : s.icon}
                </button>
                {/* Label එක ලොකු screen වල විතරයි (phone එකේ step එකේ නම card එකේ උඩ පේනවා) */}
                <span
                  className={`mt-2 px-0.5 text-center text-sm leading-tight line-clamp-2 ${
                    active ? "hidden md:block font-bold text-primary" : "hidden md:block font-medium text-muted-foreground"
                  }`}
                >
                  {W[s.id]}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step card */}
      <section className="rounded-3xl border border-border bg-background p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:h-5 [&>svg]:w-5">
            {current.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{stepTitle}</h2>
            <p className="text-sm text-muted-foreground">{stepDesc}</p>
          </div>
        </div>

        <div key={current.id} className="animate-in fade-in slide-in-from-right-2 duration-300">
          {renderStep()}
        </div>

        {/* 👇 Save වුණාම success message එක, ඊට පස්සේ Browse page එකට */}
        {finishState === "done" && (
          <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-700 dark:text-green-400 animate-in fade-in">
            <Check className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">{W.changesSaved}</p>
              <p className="flex items-center gap-1.5 text-xs opacity-80"><Loader2 className="h-3 w-3 animate-spin" /> {W.redirecting}</p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || saving}
            className="flex items-center gap-1 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:invisible"
          >
            <ChevronLeft className="h-4 w-4" /> {W.back}
          </button>

          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 animate-in fade-in">
                <Check className="h-4 w-4" /> {W.saved}
              </span>
            )}
            <button
              type="button"
              onClick={() => (isLast ? (isPublished ? finish() : publish()) : goTo(step + 1))}
              disabled={saving || publishing || photoBusy || finishState !== "idle"}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-wait ${
                finishState === "done" ? "bg-green-600 shadow-green-600/20" : "bg-gradient-to-r from-[#D52047] to-[#AD032A] shadow-primary/20 disabled:opacity-60"
              }`}
            >
              {finishState === "done" ? (
                <><Check className="h-4 w-4" /> {W.saved}</>
              ) : finishState === "saving" || saving || publishing || photoBusy ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {publishing ? PB.publishing : photoBusy ? t.photo.uploading : W.saving}</>
              ) : isLast ? (
                // 👇 Publish කරලා නම් "අවසන්" (වෙනස්කම් ඉතුරු නම් "වෙනස්කම් සුරකින්න") → Browse page එකට
                isPublished ? <><Check className="h-4 w-4" /> {hasChanges ? PB.saveChanges : W.finishDone}</> : <><Globe2 className="h-4 w-4" /> {PB.publish}</>
              ) : (
                <>{W.next} <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </section>
      {/* 👇 මගේ profile එක අනිත් අයට පේන විදිහ */}
      {preview && <ProfileModal profile={preview} onClose={() => setPreview(null)} hideActions isPreview />}
    </div>
  );
}

// ---------- Small helpers ----------

// අනිවාර්ය නැති fields (completion % එකට / "තවම ඉතුරු" එකට ගණන් ගන්නේ නෑ)
const isOptionalField = (k: FieldKey) => k === "middle_name" || k.endsWith("_info") || k.startsWith("about_me_");

// මේ user ට මේ field එක අදාළද (උදා: කේන්දරයක් නැත්නම් උපන් වේලාව ඕන නෑ)
const BIRTH_FIELDS: FieldKey[] = ["birth_date", "birth_time", "birth_place"];
function isRelevant(k: FieldKey, form: Form) {
  if (k === "district") return form.country === "Sri Lanka";
  if (BIRTH_FIELDS.includes(k)) return form.horoscope_matching === "Required";
  return true;
}

function Field({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    // 👇 data-field-error — වැරැද්දක් තියෙනවා නම් validate එකෙන් මෙතනට scroll කරලා focus කරනවා
    <div data-field-error={error ? "true" : undefined}>
      <label className="mb-2 block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-primary" aria-hidden="true">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

type Labels = ReturnType<typeof useLang>["t"];

function fieldLabel(k: FieldKey, W: Labels["wizard"], P: Labels["profile"], phoneLabel = ""): string {
  const map: Record<FieldKey, string> = {
    about_me_en: `${W.aboutTitle} (English)`, about_me_si: `${W.aboutTitle} (සිංහල)`, about_me_ta: `${W.aboutTitle} (தமிழ்)`,
    first_name: W.firstName, middle_name: W.middleName, last_name: W.lastName, phone: "", phone_country: "", gender: P.gender, age: W.age, civil_status: P.maritalStatus, mother_tongue: P.motherTongue,
    account_created_by: P.accountCreatedBy, religion: P.religion, caste: P.caste, horoscope: P.horoscope,
    horoscope_matching: W.horoscopeMatching, birth_date: W.birthDate, birth_time: W.birthTime, birth_place: W.birthPlace,
    country: W.country, district: W.district, city: W.city, education: P.education, job_title: P.profession, income: P.income,
    father_ethnicity: `${W.father} · ${W.ethnicity}`, father_religion: `${W.father} · ${P.religion}`, father_caste: `${W.father} · ${P.caste}`,
    father_job: `${W.father} · ${P.profession}`, father_country: `${W.father} · ${W.residingCountry}`, father_info: `${W.father} · ${W.additionalInfo}`,
    mother_ethnicity: `${W.mother} · ${W.ethnicity}`, mother_religion: `${W.mother} · ${P.religion}`, mother_caste: `${W.mother} · ${P.caste}`,
    mother_job: `${W.mother} · ${P.profession}`, mother_country: `${W.mother} · ${W.residingCountry}`, mother_info: `${W.mother} · ${W.additionalInfo}`,
    siblings: P.siblings, height: P.height, weight: W.weightKg,
    food_preference: P.food, drinking: P.drinking, smoking: P.smoking, differently_abled: P.differentlyAbled, hobbies: W.hobbies,
  };
  return k === "phone" ? phoneLabel : map[k];
}

function displayValue(k: FieldKey, form: Form, tr: ReturnType<typeof useTr>): string {
  const v = form[k];
  if (Array.isArray(v)) return v.map((h) => String(tr(h))).join(", ");
  if (!v) return "";
  if (k === "weight") return `${v} kg`;
  if (k === "phone") { const e164 = normalizePhone(form.phone_country, v); return e164 ? formatPhone(e164) : v; }
  if (k.endsWith("_info") || k === "birth_place" || k === "birth_date" || k === "birth_time" || k.endsWith("_name") || k === "age" || k === "siblings" || k === "height" || k === "city") return v;
  return String(tr(v));
}
