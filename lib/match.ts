// lib/match.ts
// දෙන්නෙක් අතර ගැලපීමේ ප්‍රතිශතය (match %) ගණනය කරනවා.
//
// ✅ ගණන් ගන්න කරුණු (උපරිම ලකුණු 100):
//    වයස 20 · උස 15 · ආගම 15 · මව් භාෂාව 10 · අධ්‍යාපනය 10 · ජීවන රටාව 10 · විවාහක තත්ත්වය 10 · කේන්දරය 5 · කුලය 5
// ❌ ගණන් නොගන්නේ: ස්ථානය (රට / දිස්ත්‍රික්කය / නගරය) — එක ගමක නැති වුණාට ගැලපීමට බලපාන්නේ නෑ.
//
// දෙන්නාම පුරවලා තියෙන කරුණු විතරයි ගණන් ගන්නේ. උදා: එක්කෙනෙක් ආගම දාලා නැත්නම්
// ආගම ගණනයෙන් අයින් කරලා, ඉතුරු කරුණු වලින් ප්‍රතිශතය හදනවා (අසාධාරණ විදිහට අඩු වෙන්නේ නෑ).

export type MatchFactorKey =
  | "age" | "height" | "religion" | "motherTongue" | "education" | "lifestyle" | "maritalStatus" | "horoscope" | "caste" | "preferences";

// 💞 මම කැමති සහකරු (Partner preferences — /preferences page එකෙන්, profiles.partner_prefs jsonb)
export type PartnerPrefs = {
  ageMin?: number; ageMax?: number;
  heightMin?: string; heightMax?: string;      // "5' 2\"" වගේ
  religions?: string[]; motherTongues?: string[]; civilStatus?: string[]; districts?: string[];
  educationMin?: string;                       // අවම අධ්‍යාපනය (EDU_RANK)
  food?: string; smoking?: string; drinking?: string; // "" = ගණන් නෑ
};

export type MatchFactor = { key: MatchFactorKey; score: number; max: number };
export type MatchResult = { percent: number; rawPercent: number; factors: MatchFactor[] } | null;

type P = Record<string, unknown> | null | undefined;

const WEIGHTS: Record<MatchFactorKey, number> = {
  age: 20, height: 15, religion: 15, motherTongue: 10, education: 10, lifestyle: 10, maritalStatus: 10, horoscope: 5, caste: 5,
  preferences: 30, // 👈 මම දාපු preferences වලට කොච්චර ගැලපෙනවද (preferences දාලා නැත්නම් ගණන් ගන්නේ නෑ)
};

// ගණනය කරන්න අවම වශයෙන් මෙච්චර ලකුණු වල data තියෙන්න ඕන (නැත්නම් ප්‍රතිශතය නොපෙන්වා ඉන්නවා)
const MIN_DATA = 40;

const str = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v == null ? "" : String(v).trim().toLowerCase());
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/** "5' 6\"" → 66 (inches) */
function heightInches(v: unknown): number | null {
  const m = String(v ?? "").match(/(\d+)\s*'\s*(\d+)?/);
  return m ? Number(m[1]) * 12 + Number(m[2] ?? 0) : null;
}

const EDU_RANK: Record<string, number> = {
  "o/l": 1, "a/l": 2, diploma: 3, "b.sc": 4, "b.a": 4, bba: 4, "m.sc": 5, mba: 5, phd: 6,
};

/** පිරිමි / ගැහැණු කවුද කියලා (වයස / උස නීති වලට) */
function roles(a: P, b: P) {
  const ga = str(a?.gender), gb = str(b?.gender);
  if (ga === "male" && gb === "female") return { man: a, woman: b };
  if (ga === "female" && gb === "male") return { man: b, woman: a };
  return null; // එකම ස්ත්‍රී/පුරුෂ භාවය හෝ නොදන්නවා නම් සාමාන්‍ය "ළඟ" නීතිය
}

// ---------- හැම කරුණකටම ලකුණු (0 සිට 1 දක්වා) ----------

// වයස: පිරිමියා ගැහැණු ළමයාට වඩා අවුරුදු 0-5ක් වැඩිමල් නම් හොඳම ගැලපීම
function ageScore(a: P, b: P): number | null {
  const r = roles(a, b);
  if (r) {
    const man = num(r.man?.age), woman = num(r.woman?.age);
    if (man == null || woman == null) return null;
    const diff = man - woman; // + නම් පිරිමියා වැඩිමල්
    if (diff >= 0 && diff <= 5) return 1;
    if (diff > 5 && diff <= 8) return 0.75;
    if (diff > 8 && diff <= 12) return 0.4;
    if (diff < 0 && diff >= -2) return 0.5; // ගැහැණු ළමයා අවුරුදු 1-2ක් වැඩිමල්
    if (diff < -2 && diff >= -5) return 0.2;
    return 0.05;
  }
  const x = num(a?.age), y = num(b?.age);
  if (x == null || y == null) return null;
  const d = Math.abs(x - y);
  return d <= 3 ? 1 : d <= 6 ? 0.6 : d <= 10 ? 0.3 : 0.05;
}

// උස: පිරිමියා අඟල් 1-8ක් උස නම් හොඳම ගැලපීම
function heightScore(a: P, b: P): number | null {
  const r = roles(a, b);
  if (r) {
    const man = heightInches(r.man?.height), woman = heightInches(r.woman?.height);
    if (man == null || woman == null) return null;
    const diff = man - woman;
    if (diff >= 1 && diff <= 8) return 1;
    if (diff > 8 && diff <= 12) return 0.7;
    if (diff === 0) return 0.6;
    if (diff > 12) return 0.4;
    if (diff >= -2) return 0.3; // ගැහැණු ළමයා අඟල් 1-2ක් උස
    return 0.1;
  }
  const x = heightInches(a?.height), y = heightInches(b?.height);
  if (x == null || y == null) return null;
  const d = Math.abs(x - y);
  return d <= 3 ? 1 : d <= 6 ? 0.6 : 0.3;
}

function sameScore(a: unknown, b: unknown): number | null {
  const x = str(a), y = str(b);
  if (!x || !y) return null;
  return x === y ? 1 : 0;
}

function educationScore(a: P, b: P): number | null {
  const x = EDU_RANK[str(a?.education)], y = EDU_RANK[str(b?.education)];
  if (!x || !y) return null;
  const d = Math.abs(x - y);
  return d === 0 ? 1 : d === 1 ? 0.8 : d === 2 ? 0.5 : 0.2;
}

// ජීවන රටාව: ආහාර, මත්පැන්, දුම්පානය (දුම්පානය නොගැලපීම වැඩියෙන් බලපානවා)
function lifestyleScore(a: P, b: P): number | null {
  const parts: [number, number][] = []; // [ලකුණු, බර]
  const food = sameScore(a?.food_preference, b?.food_preference);
  if (food != null) parts.push([food, 4]);
  const habit = (k: string, weight: number) => {
    const x = str(a?.[k]), y = str(b?.[k]);
    if (!x || !y) return;
    if (x === y) return parts.push([1, weight]);
    // "Occasionally" එක "Yes" / "No" දෙකටම අර්ධ වශයෙන් ගැලපෙනවා
    if (x === "occasionally" || y === "occasionally") return parts.push([0.5, weight]);
    parts.push([0, weight]);
  };
  habit("drinking", 3);
  habit("smoking", 3);
  if (parts.length === 0) return null;
  const total = parts.reduce((s, [, w]) => s + w, 0);
  return parts.reduce((s, [v, w]) => s + v * w, 0) / total;
}

function maritalScore(a: P, b: P): number | null {
  const x = str(a?.civil_status), y = str(b?.civil_status);
  if (!x || !y) return null;
  const never = (v: string) => v === "never married" || v === "single";
  if (x === y || (never(x) && never(y))) return 1;
  if (never(x) !== never(y)) return 0.3; // එක්කෙනෙක් කලින් විවාහ වෙලා
  return 0.7; // දෙන්නාම කලින් විවාහ වෙලා (Divorced / Widowed)
}

function horoscopeScore(a: P, b: P): number | null {
  const x = str(a?.horoscope_matching), y = str(b?.horoscope_matching);
  if (!x || !y) return null;
  return x === y ? 1 : 0.5;
}

/** 💞 Viewer ගේ partner preferences වලට අනිත් කෙනා කොච්චර ගැලපෙනවද (0-1). Preferences නැත්නම් null */
export function prefsScore(prefsRaw: unknown, other: P): number | null {
  const prefs = (prefsRaw && typeof prefsRaw === "object" ? prefsRaw : null) as PartnerPrefs | null;
  if (!prefs || !other) return null;
  const checks: [boolean | null, number][] = []; // [ගැලපෙනවද, බර]
  const inList = (list: string[] | undefined, v: unknown) => (list && list.length ? (str(v) ? list.map((x) => x.toLowerCase()).includes(str(v)) : null) : null);
  const age = num(other.age);
  if ((prefs.ageMin || prefs.ageMax) && age != null) checks.push([age >= (prefs.ageMin ?? 0) && age <= (prefs.ageMax ?? 200), 3]);
  const h = heightInches(other.height);
  const hMin = heightInches(prefs.heightMin), hMax = heightInches(prefs.heightMax);
  if ((hMin || hMax) && h != null) checks.push([h >= (hMin ?? 0) && h <= (hMax ?? 999), 2]);
  checks.push([inList(prefs.religions, other.religion), 3]);
  checks.push([inList(prefs.motherTongues, other.mother_tongue), 2]);
  checks.push([inList(prefs.civilStatus, other.civil_status), 2]);
  checks.push([inList(prefs.districts, other.district), 1]);
  if (prefs.educationMin) {
    const need = EDU_RANK[str(prefs.educationMin)], have = EDU_RANK[str(other.education)];
    if (need && have) checks.push([have >= need, 1.5]);
  }
  for (const k of ["food", "smoking", "drinking"] as const) {
    const want = str(prefs[k]);
    const map = { food: "food_preference", smoking: "smoking", drinking: "drinking" } as const;
    const have = str(other[map[k]]);
    if (want && have) checks.push([want === have || (k !== "food" && want === "no" && have === "occasionally" ? null : want === have), 1.5]);
  }
  const used = checks.filter(([ok]) => ok !== null) as [boolean, number][];
  if (!used.length) return null;
  const total = used.reduce((s, [, w]) => s + w, 0);
  return used.reduce((s, [ok, w]) => s + (ok ? w : 0), 0) / total;
}

/** Viewer (මම) සහ වෙන profile එකක් අතර match % */
export function computeMatch(me: P, other: P): MatchResult {
  if (!me || !other) return null;

  const raw: Record<MatchFactorKey, number | null> = {
    age: ageScore(me, other),
    height: heightScore(me, other),
    religion: sameScore(me.religion, other.religion),
    motherTongue: sameScore(me.mother_tongue, other.mother_tongue),
    education: educationScore(me, other),
    lifestyle: lifestyleScore(me, other),
    maritalStatus: maritalScore(me, other),
    horoscope: horoscopeScore(me, other),
    caste: sameScore(me.caste, other.caste),
    preferences: prefsScore(me.partner_prefs, other),
  };

  const factors: MatchFactor[] = [];
  for (const key of Object.keys(WEIGHTS) as MatchFactorKey[]) {
    const v = raw[key];
    if (v == null) continue; // දෙන්නාගෙන් කෙනෙක් පුරවලා නැත්නම් ගණන් ගන්නේ නෑ
    factors.push({ key, score: Math.round(v * WEIGHTS[key] * 10) / 10, max: WEIGHTS[key] });
  }

  const possible = factors.reduce((s, f) => s + f.max, 0);
  if (possible < MIN_DATA) return null;
  const earned = factors.reduce((s, f) => s + f.score, 0);
  const rawScore = (earned / possible) * 100;
  return { percent: displayPercent(rawScore), rawPercent: Math.round(rawScore), factors };
}

/**
 * පෙන්නන ප්‍රතිශතය: ඇත්ත ලකුණු (0-100) 30-100 පරාසයකට මෘදුව ගෙනෙනවා.
 *  - කවදාවත් 30% ට අඩු වෙන්නේ නෑ (අඩු අගයන් users ලා අධෛර්යමත් කරනවා)
 *  - බොහෝ දෙනෙක් 60% ට වැඩි (ලකුණු 20කට වැඩි නම්)
 *  - හොඳම ගැලපීම් ඉහළින්ම තියෙනවා — පිළිවෙළ (කවුද වඩා ගැලපෙන්නේ) වෙනස් වෙන්නේ නෑ
 *  උදා: 0→30, 15→57, 30→68, 50→79, 75→91, 100→100
 */
export function displayPercent(raw: number) {
  const r = Math.min(100, Math.max(0, raw)) / 100;
  return Math.round(30 + 70 * Math.sqrt(r));
}

/** ප්‍රතිශතය අනුව පාට / ලේබලය */
export function matchTier(percent: number): "great" | "good" | "fair" {
  return percent >= 85 ? "great" : percent >= 70 ? "good" : "fair";
}

/** Match ගණනයට ඕන fields (profiles table එකෙන්) — partner_prefs එකත් (SQL: 20261120_growth_features.sql) */
export const MATCH_FIELDS =
  "id, gender, age, height, religion, mother_tongue, education, food_preference, drinking, smoking, civil_status, horoscope_matching, caste, partner_prefs";
