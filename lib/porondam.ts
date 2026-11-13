// lib/porondam.ts — 🔮 කේන්දර දත්ත + මූලික පොරොන්දම් (server / browser දෙකේම — astronomy-engine නැතුව)
// ⚠️ මූලික ගැළපීමක් පමණයි (නැකත අනුව සම්මත නීති 7). අවසාන තීරණයට ජ්‍යෝතිෂවේදියෙකුගෙන් තහවුරු කරගන්න.
//    ජ්‍යෝතිෂවේදියෙකු තහවුරු කරපු සම්පූර්ණ පොරොන්දම් 20 වගුව ලැබුණාම මේක ඒකෙන් ප්‍රතිස්ථාපනය කරන්න.

export const PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"] as const;
export type PlanetKey = (typeof PLANETS)[number];

// 👇 සිංහල කේන්දර සටහනේ කෙටි නම් (රවි, චන්ද්‍ර, කුජ, බුධ, ගුරු, ශුක්‍ර, ශනි, රාහු, කේතු)
export const PLANET_SHORT: Record<string, Record<PlanetKey, string>> = {
  si: { sun: "ර", moon: "ච", mars: "කු", mercury: "බු", jupiter: "ගු", venus: "ශු", saturn: "ශ", rahu: "රා", ketu: "කේ" },
  en: { sun: "Su", moon: "Mo", mars: "Ma", mercury: "Me", jupiter: "Ju", venus: "Ve", saturn: "Sa", rahu: "Ra", ketu: "Ke" },
  ta: { sun: "சூ", moon: "சந்", mars: "செ", mercury: "பு", jupiter: "கு", venus: "சு", saturn: "சனி", rahu: "ரா", ketu: "கே" },
};
export const PLANET_NAMES: Record<string, Record<PlanetKey, string>> = {
  si: { sun: "රවි", moon: "චන්ද්‍ර", mars: "කුජ", mercury: "බුධ", jupiter: "ගුරු", venus: "ශුක්‍ර", saturn: "ශනි", rahu: "රාහු", ketu: "කේතු" },
  en: { sun: "Sun", moon: "Moon", mars: "Mars", mercury: "Mercury", jupiter: "Jupiter", venus: "Venus", saturn: "Saturn", rahu: "Rahu", ketu: "Ketu" },
  ta: { sun: "சூரியன்", moon: "சந்திரன்", mars: "செவ்வாய்", mercury: "புதன்", jupiter: "குரு", venus: "சுக்கிரன்", saturn: "சனி", rahu: "ராகு", ketu: "கேது" },
};
export const SIGNS: Record<string, string[]> = {
  si: ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"],
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  ta: ["மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி", "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்"],
};
export const NAKSHATRAS: Record<string, string[]> = {
  si: ["අස්විද", "බෙරණ", "කැති", "රෙහෙණ", "මුවසිරස", "අද", "පුනාවස", "පුෂ", "අස්ලිය", "මා", "පුවපල්", "උත්තරපල්", "හත", "සිත", "සා", "විසා", "අනුර", "දෙට", "මුල", "පුවසල", "උත්තරසල", "සුවණ", "දෙනට", "සියාවස", "පුවපුටුප", "උත්තරපුටුප", "රේවතී"],
  en: ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"],
  ta: ["அசுவினி", "பரணி", "கிருத்திகை", "ரோகிணி", "மிருகசீரிடம்", "திருவாதிரை", "புனர்பூசம்", "பூசம்", "ஆயில்யம்", "மகம்", "பூரம்", "உத்திரம்", "அஸ்தம்", "சித்திரை", "சுவாதி", "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்", "பூராடம்", "உத்திராடம்", "திருவோணம்", "அவிட்டம்", "சதயம்", "பூரட்டாதி", "உத்திரட்டாதி", "ரேவதி"],
};

/** Save කරන කේන්දරය (profile_private.horoscope) — ලග්නය + හැම ග්‍රහයෙක්ම ඉන්න රාශිය (0 = මේෂ … 11 = මීන) */
export type Horoscope = {
  lagna: number;
  planets: Record<PlanetKey, number>;
  navamsaLagna?: number;
  navamsa?: Record<PlanetKey, number>;
  nakshatra: number; // 0–26 (චන්ද්‍රයා ඉන්න නැකත)
  pada: number;      // 1–4
  source: "generated" | "edited";
  birth?: { date: string; time: string; place: string };
  updated_at?: string;
};

export function isHoroscope(h: unknown): h is Horoscope {
  if (!h || typeof h !== "object") return false;
  const x = h as Horoscope;
  const sign = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 12;
  return sign(x.lagna) && !!x.planets && PLANETS.every((p) => sign(x.planets[p])) && Number.isInteger(x.nakshatra) && x.nakshatra >= 0 && x.nakshatra < 27 && x.pada >= 1 && x.pada <= 4;
}

// ───────── 💞 මූලික පොරොන්දම් (නැකත අනුව) ─────────
const GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]; // 0 දේව · 1 මනුෂ්‍ය · 2 රාක්ෂ
const NADI = (n: number) => ([0, 5].includes(n % 6) ? 0 : [1, 4].includes(n % 6) ? 1 : 2); // ආදි · මධ්‍ය · අන්ත්‍ය
const RAJJU = [0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 3, 2, 1, 0]; // පාද · කටි · නාභි · කණ්ඨ · ශිරෝ

export type PorondamKey = "dina" | "gana" | "mahendra" | "streeDeergha" | "rashi" | "nadi" | "rajju";
export type PorondamResult = { checks: { key: PorondamKey; ok: boolean }[]; score: number; total: number };

/** girl / boy — දෙදෙනාගේම කේන්දර (චන්ද්‍ර නැකත + රාශිය) */
export function basicPorondam(girl: Horoscope, boy: Horoscope): PorondamResult {
  const g = girl.nakshatra, b = boy.nakshatra;
  const count = ((b - g + 27) % 27) + 1; // ගැහැණු ළමයාගේ නැකතේ සිට පිරිමි ළමයාගේ නැකතට (දෙකම ඇතුළුව)
  const tara = count % 9;
  const gg = GANA[g], bg = GANA[b];
  const rashiDist = ((boy.planets.moon - girl.planets.moon + 12) % 12) + 1; // ගැහැණු රාශියේ සිට පිරිමි රාශියට
  const checks: { key: PorondamKey; ok: boolean }[] = [
    { key: "dina", ok: ![3, 5, 7].includes(tara) },
    { key: "gana", ok: gg === bg || (gg !== 2 && bg !== 2) },
    { key: "mahendra", ok: [4, 7, 10, 13, 16, 19, 22, 25].includes(count) },
    { key: "streeDeergha", ok: count > 13 },
    { key: "rashi", ok: ![2, 12, 6, 8, 5, 9].includes(rashiDist) },
    { key: "nadi", ok: NADI(g) !== NADI(b) },
    { key: "rajju", ok: RAJJU[g] !== RAJJU[b] },
  ];
  return { checks, score: checks.filter((c) => c.ok).length, total: checks.length };
}


// ═════════ 🔮 සම්පූර්ණ පොරොන්දම් (20) — update-34 ═════════
// ✅ ගණනය කරන්නේ සම්මත වගු තියෙන ඒවා 13ක් (8 පොරොන්දමේ ඔක්කොම ඇතුළුව).
// ⏳ ඉතුරු 7 (වෘක්ෂ, ආයුෂ, පක්ෂි, භූත, ගෝත්‍ර, ලිංග, ග්‍රහ) — ජ්‍යෝතිෂවේදියෙකු තහවුරු කරපු වගුව ලැබුණාම එකතු කරනවා.
export const PORONDAM_20 = [
  "nakath", "gana", "mahendra", "deerga", "yoni", "rasi", "rashiadhipathi", "vashya", "rajju", "weda",
  "vriksha", "ayusha", "pakshi", "bhootha", "gothra", "warna", "linga", "nadi", "dina", "graha",
] as const;
export type Porondam20Key = (typeof PORONDAM_20)[number];
export const PORONDAM_8: Porondam20Key[] = ["nakath", "gana", "yoni", "rasi", "rashiadhipathi", "vashya", "warna", "nadi"];

// 👇 නැකත අනුව යෝනිය (සතා) — 0 අශ්ව · 1 ගජ · 2 මේෂ · 3 සර්ප · 4 ශ්වාන · 5 මාර්ජාර · 6 මූෂික · 7 ගෝ · 8 මහිෂ · 9 ව්‍යාඝ්‍ර · 10 මෘග · 11 වානර · 12 නකුල · 13 සිංහ
const YONI = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
const YONI_ENEMY: [number, number][] = [[0, 8], [1, 13], [2, 11], [3, 12], [4, 10], [5, 6], [7, 9]];
// 👇 රාශි අධිපති (0 රවි 1 චන්ද්‍ර 2 කුජ 3 බුධ 4 ගුරු 5 ශුක්‍ර 6 ශනි)
const SIGN_LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
// ග්‍රහ මිත්‍රත්වය: 1 මිත්‍ර · 0 සම · -1 සතුරු  [planet][other]
const FRIEND: number[][] = [
  [1, 1, 1, 0, 1, -1, -1], [1, 1, 0, 1, 0, 0, 0], [1, 1, 1, -1, 1, 0, 0], [1, -1, 0, 1, 0, 1, 0],
  [1, 1, 1, -1, 1, -1, 0], [-1, -1, 0, 1, 0, 1, 1], [-1, -1, -1, 1, 0, 1, 1],
];
// 👇 වර්ණ (රාශිය අනුව): 3 බ්‍රාහ්මණ · 2 ක්ෂත්‍රිය · 1 වෛශ්‍ය · 0 ශුද්‍ර
const WARNA = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3];
// 👇 වශ්‍ය කාණ්ඩ: 0 චතුෂ්පාද · 1 මානව · 2 ජලචර · 3 වනචර · 4 කීට
const VASHYA = [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2];
// 👇 වේධ යුගල (එකට අයහපත්)
const WEDA: [number, number][] = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 22], [4, 13], [13, 22]];
const pairIn = (list: [number, number][], a: number, b: number) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export type PorondamRow = { key: Porondam20Key; ok: boolean | null; mine?: string; theirs?: string }; // ok=null → ජ්‍යෝතිෂවේදියෙකුගෙන්
export type DoshaKey = "kuja" | "shaniMangala" | "kalaSarpa" | "grahana" | "guruChandala";
export type DoshaRow = { key: DoshaKey; mine: boolean; theirs: boolean; ok: boolean };
export type FullPorondam = { rows: PorondamRow[]; score8: number; score20: number; computed20: number; percent: number; doshas: DoshaRow[] };

// 🔥 කුජ දෝෂය — ලග්නයේ සිට කුජ 1, 2, 4, 7, 8, 12 භාවයක නම්
export const hasKujaDosha = (h: Horoscope) => [1, 2, 4, 7, 8, 12].includes(((h.planets.mars - h.lagna + 12) % 12) + 1);
// 🪐 ශනි-මංගල (කුජ) දෝෂය — ශනි සහ කුජ එකම රාශියේ (යුතිය) හෝ එකිනෙකාට 7 වැනිව (ප්‍රතියුතිය)
export const hasShaniMangalaDosha = (h: Horoscope) => { const d = (h.planets.saturn - h.planets.mars + 12) % 12; return d === 0 || d === 6; };
// 🐍 කාල සර්ප දෝෂය — ග්‍රහයන් 7ම (රවි–ශනි) රාහු-කේතු අක්ෂයේ එක පැත්තකට
export const hasKalaSarpaDosha = (h: Horoscope) => {
  const ds = (["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"] as const).map((p) => (h.planets[p] - h.planets.rahu + 12) % 12);
  return ds.every((d) => d >= 1 && d <= 5) || ds.every((d) => d >= 7 && d <= 11);
};
// 🌑 ග්‍රහණ දෝෂය — රවි හෝ චන්ද්‍ර රාහු / කේතු එක්ක එකම රාශියේ
export const hasGrahanaDosha = (h: Horoscope) => [h.planets.sun, h.planets.moon].some((x) => x === h.planets.rahu || x === h.planets.ketu);
// 🪔 ගුරු චණ්ඩාල දෝෂය — ගුරු රාහු / කේතු එක්ක එකම රාශියේ
export const hasGuruChandalaDosha = (h: Horoscope) => h.planets.jupiter === h.planets.rahu || h.planets.jupiter === h.planets.ketu;

const LABELS: Record<string, { gana: string[]; yoni: string[]; warna: string[]; vashya: string[]; nadi: string[]; rajju: string[]; lord: string[] }> = {
  si: { gana: ["දේව", "මනුෂ්‍ය", "රාක්ෂ"], yoni: ["අශ්ව", "ගජ", "මේෂ", "සර්ප", "ශ්වාන", "මාර්ජාර", "මූෂික", "ගෝ", "මහිෂ", "ව්‍යාඝ්‍ර", "මෘග", "වානර", "නකුල", "සිංහ"], warna: ["ශුද්‍ර", "වෛශ්‍ය", "ක්ෂත්‍රිය", "බ්‍රාහ්මණ"], vashya: ["චතුෂ්පාද", "මානව", "ජලචර", "වනචර", "කීට"], nadi: ["ආදි", "මධ්‍ය", "අන්ත්‍ය"], rajju: ["පාද", "කටි", "නාභි", "කණ්ඨ", "ශිරෝ"], lord: ["රවි", "චන්ද්‍ර", "කුජ", "බුධ", "ගුරු", "ශුක්‍ර", "ශනි"] },
  en: { gana: ["Deva", "Manushya", "Rakshasa"], yoni: ["Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo", "Tiger", "Deer", "Monkey", "Mongoose", "Lion"], warna: ["Shudra", "Vaishya", "Kshatriya", "Brahmin"], vashya: ["Quadruped", "Human", "Water", "Wild", "Insect"], nadi: ["Adi", "Madhya", "Antya"], rajju: ["Pada", "Kati", "Nabhi", "Kantha", "Shiro"], lord: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] },
  ta: { gana: ["தேவ", "மனுஷ", "ராட்சச"], yoni: ["குதிரை", "யானை", "ஆடு", "பாம்பு", "நாய்", "பூனை", "எலி", "பசு", "எருமை", "புலி", "மான்", "குரங்கு", "கீரி", "சிங்கம்"], warna: ["சூத்திர", "வைசிய", "க்ஷத்திரிய", "பிராமண"], vashya: ["நாற்கால்", "மனித", "நீர்", "காட்டு", "பூச்சி"], nadi: ["ஆதி", "மத்திய", "அந்திய"], rajju: ["பாத", "கடி", "நாபி", "கண்ட", "சிரோ"], lord: ["சூரியன்", "சந்திரன்", "செவ்வாய்", "புதன்", "குரு", "சுக்கிரன்", "சனி"] },
};

/** 📋 සම්පූර්ණ පොරොන්දම් වගුව — ඔයා (me) සහ සහකරු (them) — gender අනුව ගැහැණු/පිරිමි තීරණය කරනවා */
export function fullPorondam(me: Horoscope, them: Horoscope, meIsGirl: boolean, lang = "si"): FullPorondam {
  const girl = meIsGirl ? me : them, boy = meIsGirl ? them : me;
  const L = LABELS[lang] ?? LABELS.si;
  const naks = NAKSHATRAS[lang] ?? NAKSHATRAS.si;
  const signs = SIGNS[lang] ?? SIGNS.si;
  const g = girl.nakshatra, b = boy.nakshatra;
  const gs = girl.planets.moon, bs = boy.planets.moon;
  const count = ((b - g + 27) % 27) + 1;
  const gl = SIGN_LORD[gs], bl = SIGN_LORD[bs];
  const fr = Math.min(FRIEND[gl][bl], FRIEND[bl][gl]);
  const yg = YONI[g], yb = YONI[b];
  const v = (h: Horoscope) => ({ nak: naks[h.nakshatra], sign: signs[h.planets.moon] });
  const val = (gv: string, bv: string) => (meIsGirl ? { mine: gv, theirs: bv } : { mine: bv, theirs: gv });
  const basic = basicPorondam(girl, boy);
  const bOk = (k: PorondamKey) => basic.checks.find((c) => c.key === k)!.ok;

  const rows: PorondamRow[] = [
    { key: "nakath", ok: bOk("dina"), ...val(v(girl).nak, v(boy).nak) },
    { key: "gana", ok: bOk("gana"), ...val(L.gana[GANA[g]], L.gana[GANA[b]]) },
    { key: "mahendra", ok: bOk("mahendra") },
    { key: "deerga", ok: bOk("streeDeergha") },
    { key: "yoni", ok: yg === yb ? true : pairIn(YONI_ENEMY, yg, yb) ? false : true, ...val(L.yoni[yg], L.yoni[yb]) },
    { key: "rasi", ok: bOk("rashi"), ...val(v(girl).sign, v(boy).sign) },
    { key: "rashiadhipathi", ok: gl === bl || fr >= 0, ...val(L.lord[gl], L.lord[bl]) },
    { key: "vashya", ok: VASHYA[gs] === VASHYA[bs] || (VASHYA[gs] !== 3 && VASHYA[bs] !== 3 && VASHYA[gs] !== 4 && VASHYA[bs] !== 4 && Math.abs(VASHYA[gs] - VASHYA[bs]) === 1), ...val(L.vashya[VASHYA[gs]], L.vashya[VASHYA[bs]]) },
    { key: "rajju", ok: bOk("rajju"), ...val(L.rajju[RAJJU[g]], L.rajju[RAJJU[b]]) },
    { key: "weda", ok: !pairIn(WEDA, g, b) },
    { key: "vriksha", ok: null },
    { key: "ayusha", ok: null },
    { key: "pakshi", ok: null },
    { key: "bhootha", ok: null },
    { key: "gothra", ok: null },
    { key: "warna", ok: WARNA[bs] >= WARNA[gs], ...val(L.warna[WARNA[gs]], L.warna[WARNA[bs]]) },
    { key: "linga", ok: null },
    { key: "nadi", ok: bOk("nadi"), ...val(L.nadi[NADI(g)], L.nadi[NADI(b)]) },
    { key: "dina", ok: [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26].includes(count) },
    { key: "graha", ok: null },
  ];
  // 👇 ලංකාවේ ක්‍රමයට සම්මත වගු තියෙන ඒවා විතරයි පෙන්නන්නේ (ගණනය නොකරන ඒවා අයින්)
  const computed = rows.filter((r) => r.ok !== null);
  const score20 = computed.filter((r) => r.ok).length;
  const score8 = rows.filter((r) => PORONDAM_8.includes(r.key) && r.ok).length;
  // 🔥 දෝෂ — දෙදෙනාටම තියෙනවා නම් හෝ දෙදෙනාටම නැත්නම් "සම" (ගැළපෙනවා), එක්කෙනෙකුට විතරක් නම් ගැළපෙන්නේ නෑ
  const dosha = (key: DoshaRow["key"], fn: (h: Horoscope) => boolean): DoshaRow => { const a = fn(me), b = fn(them); return { key, mine: a, theirs: b, ok: a === b }; };
  const doshas = [dosha("kuja", hasKujaDosha), dosha("shaniMangala", hasShaniMangalaDosha), dosha("kalaSarpa", hasKalaSarpaDosha), dosha("grahana", hasGrahanaDosha), dosha("guruChandala", hasGuruChandalaDosha)];
  return { rows: computed, score8, score20, computed20: computed.length, percent: Math.round((score20 / Math.max(1, computed.length)) * 100), doshas };
}
