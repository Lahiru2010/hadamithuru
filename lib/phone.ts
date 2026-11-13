// lib/phone.ts
// Mobile numbers: රට තෝරලා (default ශ්‍රී ලංකාව +94) number එක validate කරලා "+94771234567" (E.164) විදිහට save කරනවා.

export type DialCountry = {
  iso: string;      // "LK"
  name: string;     // option_translations එකෙන් පරිවර්තනය වෙනවා
  dial: string;     // "94"
  min: number;      // රටේ code එක නැතුව ඉලක්කම් ගණන (අවම)
  max: number;      // (උපරිම)
  example: string;  // placeholder එකට
};

export const DEFAULT_PHONE_COUNTRY = "LK";

export const DIAL_COUNTRIES: DialCountry[] = [
  // දකුණු ආසියාව
  { iso: "LK", name: "Sri Lanka", dial: "94", min: 9, max: 9, example: "77 123 4567" },
  { iso: "IN", name: "India", dial: "91", min: 10, max: 10, example: "98765 43210" },
  { iso: "MV", name: "Maldives", dial: "960", min: 7, max: 7, example: "771 2345" },
  { iso: "PK", name: "Pakistan", dial: "92", min: 10, max: 10, example: "301 2345678" },
  { iso: "BD", name: "Bangladesh", dial: "880", min: 10, max: 10, example: "1812 345678" },
  { iso: "NP", name: "Nepal", dial: "977", min: 10, max: 10, example: "984 1234567" },
  // මැද පෙරදිග
  { iso: "AE", name: "United Arab Emirates", dial: "971", min: 9, max: 9, example: "50 123 4567" },
  { iso: "QA", name: "Qatar", dial: "974", min: 8, max: 8, example: "3312 3456" },
  { iso: "SA", name: "Saudi Arabia", dial: "966", min: 9, max: 9, example: "51 234 5678" },
  { iso: "KW", name: "Kuwait", dial: "965", min: 8, max: 8, example: "500 12345" },
  { iso: "OM", name: "Oman", dial: "968", min: 8, max: 8, example: "9212 3456" },
  { iso: "BH", name: "Bahrain", dial: "973", min: 8, max: 8, example: "3600 1234" },
  { iso: "JO", name: "Jordan", dial: "962", min: 9, max: 9, example: "7 9012 3456" },
  { iso: "LB", name: "Lebanon", dial: "961", min: 7, max: 8, example: "71 123 456" },
  { iso: "IL", name: "Israel", dial: "972", min: 9, max: 9, example: "50 234 5678" },
  { iso: "CY", name: "Cyprus", dial: "357", min: 8, max: 8, example: "9612 3456" },
  // නැගෙනහිර / අග්නිදිග ආසියාව
  { iso: "SG", name: "Singapore", dial: "65", min: 8, max: 8, example: "8123 4567" },
  { iso: "MY", name: "Malaysia", dial: "60", min: 9, max: 10, example: "12 345 6789" },
  { iso: "TH", name: "Thailand", dial: "66", min: 9, max: 9, example: "81 234 5678" },
  { iso: "ID", name: "Indonesia", dial: "62", min: 9, max: 12, example: "812 3456 789" },
  { iso: "PH", name: "Philippines", dial: "63", min: 10, max: 10, example: "905 123 4567" },
  { iso: "HK", name: "Hong Kong", dial: "852", min: 8, max: 8, example: "5123 4567" },
  { iso: "CN", name: "China", dial: "86", min: 11, max: 11, example: "131 2345 6789" },
  { iso: "TW", name: "Taiwan", dial: "886", min: 9, max: 9, example: "912 345 678" },
  { iso: "JP", name: "Japan", dial: "81", min: 10, max: 10, example: "90 1234 5678" },
  { iso: "KR", name: "South Korea", dial: "82", min: 9, max: 10, example: "10 2000 0000" },
  // ඕෂනියාව
  { iso: "AU", name: "Australia", dial: "61", min: 9, max: 9, example: "412 345 678" },
  { iso: "NZ", name: "New Zealand", dial: "64", min: 8, max: 10, example: "21 123 4567" },
  // යුරෝපය
  { iso: "GB", name: "United Kingdom", dial: "44", min: 10, max: 10, example: "7400 123456" },
  { iso: "IE", name: "Ireland", dial: "353", min: 9, max: 9, example: "85 012 3456" },
  { iso: "IT", name: "Italy", dial: "39", min: 9, max: 10, example: "312 345 6789" },
  { iso: "FR", name: "France", dial: "33", min: 9, max: 9, example: "6 12 34 56 78" },
  { iso: "DE", name: "Germany", dial: "49", min: 10, max: 11, example: "1512 3456789" },
  { iso: "CH", name: "Switzerland", dial: "41", min: 9, max: 9, example: "78 123 45 67" },
  { iso: "NL", name: "Netherlands", dial: "31", min: 9, max: 9, example: "6 12345678" },
  { iso: "BE", name: "Belgium", dial: "32", min: 9, max: 9, example: "470 12 34 56" },
  { iso: "AT", name: "Austria", dial: "43", min: 10, max: 13, example: "664 123456" },
  { iso: "SE", name: "Sweden", dial: "46", min: 9, max: 9, example: "70 123 45 67" },
  { iso: "NO", name: "Norway", dial: "47", min: 8, max: 8, example: "406 12 345" },
  { iso: "DK", name: "Denmark", dial: "45", min: 8, max: 8, example: "32 12 34 56" },
  { iso: "FI", name: "Finland", dial: "358", min: 9, max: 10, example: "41 2345678" },
  { iso: "ES", name: "Spain", dial: "34", min: 9, max: 9, example: "612 34 56 78" },
  { iso: "PT", name: "Portugal", dial: "351", min: 9, max: 9, example: "912 345 678" },
  { iso: "GR", name: "Greece", dial: "30", min: 10, max: 10, example: "691 234 5678" },
  { iso: "PL", name: "Poland", dial: "48", min: 9, max: 9, example: "512 345 678" },
  { iso: "RO", name: "Romania", dial: "40", min: 9, max: 9, example: "712 034 567" },
  { iso: "RU", name: "Russia", dial: "7", min: 10, max: 10, example: "912 345 6789" },
  // ඇමරිකාව
  { iso: "US", name: "United States", dial: "1", min: 10, max: 10, example: "201 555 0123" },
  { iso: "CA", name: "Canada", dial: "1", min: 10, max: 10, example: "506 234 5678" },
  // අප්‍රිකාව
  { iso: "SC", name: "Seychelles", dial: "248", min: 7, max: 7, example: "2 510 123" },
  { iso: "ZA", name: "South Africa", dial: "27", min: 9, max: 9, example: "71 123 4567" },
  { iso: "KE", name: "Kenya", dial: "254", min: 9, max: 9, example: "712 123456" },
];

export const getDialCountry = (iso: string) =>
  DIAL_COUNTRIES.find((c) => c.iso === iso) ?? DIAL_COUNTRIES[0];

export const flagUrl = (iso: string) => `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;

/** තෝරපු රට + type කරපු number එක → "+94771234567". වැරදි නම් null */
export function normalizePhone(iso: string, input: string): string | null {
  const c = getDialCountry(iso);
  let digits = input.replace(/\D/g, "");
  // User රටේ code එකත් එක්කම type කළොත් (+94 77... / 9477...) ඒක අයින් කරනවා
  if (input.trim().startsWith("+") || digits.length > c.max) {
    if (digits.startsWith(c.dial)) digits = digits.slice(c.dial.length);
  }
  // රට ඇතුළේ පාවිච්චි කරන මුල් 0 එක (077... → 77...)
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length < c.min || digits.length > c.max) return null;
  if (c.iso === "LK" && !digits.startsWith("7")) return null; // ශ්‍රී ලංකා ජංගම අංක 7 න් පටන් ගන්නවා
  return `+${c.dial}${digits}`;
}

/** "+94771234567" → { iso: "LK", national: "771234567" } */
export function parsePhone(e164: string | null | undefined): { iso: string; national: string } {
  if (!e164) return { iso: DEFAULT_PHONE_COUNTRY, national: "" };
  const digits = e164.replace(/\D/g, "");
  if (!e164.startsWith("+")) return { iso: DEFAULT_PHONE_COUNTRY, national: digits };
  const match = [...DIAL_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => digits.startsWith(c.dial));
  if (!match) return { iso: DEFAULT_PHONE_COUNTRY, national: digits };
  // +1 නම් default එක United States
  const iso = match.dial === "1" ? "US" : match.iso;
  return { iso, national: digits.slice(match.dial.length) };
}

/** "+94771234567" → "+94 77 123 4567" */
export function formatPhone(e164: string): string {
  const lk = e164.match(/^\+94(\d{2})(\d{3})(\d{4})$/);
  if (lk) return `+94 ${lk[1]} ${lk[2]} ${lk[3]}`;
  const { iso, national } = parsePhone(e164);
  return national ? `+${getDialCountry(iso).dial} ${national}` : e164;
}

// ----- පරණ functions (කලින් code එක කැඩෙන්නේ නැති වෙන්න) -----
export const normalizeSriLankanMobile = (input: string) => normalizePhone("LK", input);
export const formatSriLankanMobile = formatPhone;
