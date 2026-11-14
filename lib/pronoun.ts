// lib/pronoun.ts — 👤 update-60: "මේ කෙනා" වෙනුවට ස්ත්‍රී / පුරුෂ භාවය අනුව
//   ගැහැණු කෙනෙක් නම් "මෙයා", පිරිමි කෙනෙක් නම් "මොහු" (දන්නේ නැත්නම් "මේ කෙනා")
//   text එකේ {who} / {whom} / {their} replace කරනවා
type Lang = "si" | "en" | "ta";

function kind(gender?: string | null): "f" | "m" | null {
  const g = String(gender ?? "").trim().toLowerCase();
  if (!g) return null;
  if (g.startsWith("f") || g.includes("ස්ත්‍රී") || g.includes("ගැහැණු") || g.includes("பெண்")) return "f";
  if (g.startsWith("m") || g.includes("පුරුෂ") || g.includes("පිරිමි") || g.includes("ஆண்")) return "m";
  return null;
}

const WORDS: Record<Lang, Record<"f" | "m" | "x", { who: string; whom: string; their: string }>> = {
  si: { f: { who: "මෙයා", whom: "මෙයාට", their: "මෙයාගේ" }, m: { who: "මොහු", whom: "මොහුට", their: "මොහුගේ" }, x: { who: "මේ කෙනා", whom: "මේ කෙනාට", their: "මේ කෙනාගේ" } },
  en: { f: { who: "She", whom: "her", their: "her" }, m: { who: "He", whom: "him", their: "his" }, x: { who: "This person", whom: "this person", their: "their" } },
  ta: { f: { who: "இவர்", whom: "இவருக்கு", their: "இவரது" }, m: { who: "இவர்", whom: "இவருக்கு", their: "இவரது" }, x: { who: "இவர்", whom: "இவருக்கு", their: "இவரது" } },
};

/** text එකේ {who} / {whom} / {their} → ස්ත්‍රී / පුරුෂ භාවය අනුව */
export function withPronoun(text: string, lang: string, gender?: string | null) {
  const w = WORDS[(lang as Lang) in WORDS ? (lang as Lang) : "si"][kind(gender) ?? "x"];
  return text.replace(/\{who\}/g, w.who).replace(/\{whom\}/g, w.whom).replace(/\{their\}/g, w.their);
}
