// lib/last-seen.ts
// "අන්තිමට online හිටියේ කවදාද" — language එකට අනුව ("පැය 2කට පෙර" / "2 hours ago")
const LOCALE: Record<string, string> = { si: "si-LK", ta: "ta-LK", en: "en-GB" };

/**
 * Database එකේ වෙලාව හැම browser එකකම හරියට කියවන්න.
 * Supabase / Postgres වෙලාවල් "2026-11-09T05:30:12.345678+00:00" වගේ — දශම ඉලක්කම් 6ක් (microseconds).
 * Safari වගේ browsers වලට ඒක තේරෙන්නේ නෑ (Invalid Date) — ඒ නිසා 3ට කපලා, space / "+00" වගේ ඒවත් හදනවා.
 */
export function parseTs(value: string | null | undefined): number {
  if (!value) return NaN;
  const fixed = String(value)
    .trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")            // .345678 → .345
    .replace(/([+-]\d{2})(\d{2})$/, "$1:$2")   // +0000 → +00:00
    .replace(/([+-]\d{2})$/, "$1:00");          // +00 → +00:00
  const t = Date.parse(fixed);
  return Number.isNaN(t) ? Date.parse(String(value)) : t;
}

/**
 * 🟢 "දැන් online" — site එකේ දැන් ඉන්නවා නම් (විනාඩි 5ක් ඇතුළත ping එකක්)
 * නැත්නම් "අන්තිමට login වුණේ X කට පෙර" — Supabase auth එකේ ඇත්ත login වෙලාව (last_login_at)
 */
export function lastSeenText(
  seenIso: string | null | undefined,
  lang: string,
  labels: { onlineNow: string; activeAgo: string },
  loginIso?: string | null
) {
  const seenSec = seenIso ? (Date.now() - parseTs(seenIso)) / 1000 : Infinity;
  if (seenSec < 5 * 60) return { online: true, text: labels.onlineNow };
  const iso = loginIso ?? null;
  if (!iso) return null;
  const diffSec = (Date.now() - parseTs(iso)) / 1000;
  if (!Number.isFinite(diffSec)) return null;
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang] ?? "en-GB", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["minute", 60], ["hour", 3600], ["day", 86400], ["week", 604800], ["month", 2592000]];
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let value = diffSec / 60;
  for (const [u, sec] of units) {
    if (diffSec >= sec) { unit = u; value = diffSec / sec; }
  }
  return { online: false, text: labels.activeAgo.replace("{time}", rtf.format(-Math.floor(value), unit)) };
}

/** මගේ "last seen" එක update කරන්න (navbar එකෙන් විනාඩි 5කට සැරයක්) */
export const LAST_SEEN_INTERVAL_MS = 5 * 60 * 1000;

/** "විනාඩි 5කට පෙර" / "2 hours ago" — chat list එකේ අන්තිම message එකේ වෙලාවට */
export function timeAgo(iso: string | null | undefined, lang: string, justNow: string) {
  if (!iso) return "";
  const diffSec = (Date.now() - parseTs(iso)) / 1000;
  if (!Number.isFinite(diffSec)) return "";
  if (diffSec < 60) return justNow;
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang] ?? "en-GB", { numeric: "auto", style: "short" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["minute", 60], ["hour", 3600], ["day", 86400], ["week", 604800], ["month", 2592000], ["year", 31536000]];
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let value = diffSec / 60;
  for (const [u, sec] of units) if (diffSec >= sec) { unit = u; value = diffSec / sec; }
  return rtf.format(-Math.floor(value), unit);
}
