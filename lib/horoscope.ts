// lib/horoscope.ts — 🔮 උපන් දිනය / වේලාව / ස්ථානය අනුව කේන්දරය ගණනය (browser එකේ, astronomy-engine)
// • Sidereal (නිරයන) — ලාහිරි අයනාංශ · රාහු/කේතු = මධ්‍ය පාත · ලග්නය = උදාවන රාශිය
// • ලංකාවේ වේලාව "Asia/Colombo" — 1996–2006 කාලයේ වෙනස් වුණ වේලා කලාපත් (+6:30 / +6:00) හරියට ගණන් ගන්නවා
// ✅ 1989-03-21 පෙ.ව. 6.46 කොළඹ — ලග්නය, ග්‍රහයන් 9ම, නැකත (පුවපල් 3 පාදය) ජ්‍යෝතිෂවේදියෙකුගේ කේන්දරයට සමානයි
"use client";

import * as Astronomy from "astronomy-engine";
import type { Horoscope, PlanetKey } from "@/lib/porondam";

const AYANAMSA_J2000 = 23.85306; // ලාහිරි (2000-01-01)
const AYANAMSA_PER_CENTURY = 1.396971;
const norm = (x: number) => ((x % 360) + 360) % 360;

// 👇 දිස්ත්‍රික්ක අනුව අක්ෂාංශ / දේශාංශ (ප්‍රධාන නගරය) — ලග්නයට අඩු / වැඩි ලෙස බලපාන්නේ ස්වල්පයයි
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  Ampara: [7.30, 81.67], Anuradhapura: [8.31, 80.40], Badulla: [6.99, 81.06], Batticaloa: [7.73, 81.69], Colombo: [6.93, 79.86],
  Galle: [6.05, 80.22], Gampaha: [7.09, 79.99], Hambantota: [6.12, 81.12], Jaffna: [9.66, 80.03], Kalutara: [6.58, 79.96],
  Kandy: [7.29, 80.63], Kegalle: [7.25, 80.35], Kilinochchi: [9.39, 80.40], Kurunegala: [7.49, 80.36], Mannar: [8.98, 79.90],
  Matale: [7.47, 80.62], Matara: [5.95, 80.55], Moneragala: [6.87, 81.35], Mullaitivu: [9.27, 80.81], "Nuwara Eliya": [6.97, 80.78],
  Polonnaruwa: [7.94, 81.00], Puttalam: [8.04, 79.83], Ratnapura: [6.68, 80.40], Trincomalee: [8.59, 81.21], Vavuniya: [8.75, 80.50],
};

/** දේශීය වේලාව (time zone එකේ) → UTC */
function tzOffsetMs(utcMs: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs;
}
export function localToUtc(date: string, time: string, tz = "Asia/Colombo") {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let u = guess - tzOffsetMs(guess, tz);
  u = guess - tzOffsetMs(u, tz);
  return new Date(u);
}

/** 🔮 කේන්දරය ගණනය කරනවා */
export function computeHoroscope(input: { date: string; time: string; lat: number; lon: number; tz?: string; place?: string }): Horoscope {
  const t = Astronomy.MakeTime(localToUtc(input.date, input.time, input.tz));
  const T = t.tt / 36525;
  const ayan = AYANAMSA_J2000 + AYANAMSA_PER_CENTURY * T;
  const sid = (tropical: number) => norm(tropical - ayan);
  const lonOf = (body: Astronomy.Body) => sid(Astronomy.Ecliptic(Astronomy.GeoVector(body, t, true)).elon);

  const lons: Record<PlanetKey, number> = {
    sun: lonOf(Astronomy.Body.Sun),
    moon: lonOf(Astronomy.Body.Moon),
    mars: lonOf(Astronomy.Body.Mars),
    mercury: lonOf(Astronomy.Body.Mercury),
    jupiter: lonOf(Astronomy.Body.Jupiter),
    venus: lonOf(Astronomy.Body.Venus),
    saturn: lonOf(Astronomy.Body.Saturn),
    rahu: sid(125.04452 - 1934.136261 * T), // මධ්‍ය රාහු
    ketu: 0,
  };
  lons.ketu = norm(lons.rahu + 180);

  // 👇 ලග්නය (Ascendant)
  const ramc = norm(Astronomy.SiderealTime(t) * 15 + input.lon) * (Math.PI / 180);
  const eps = (23.4392911 - 0.0130042 * T) * (Math.PI / 180);
  const phi = input.lat * (Math.PI / 180);
  const asc = sid(norm((Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * 180) / Math.PI));

  const sign = (l: number) => Math.floor(l / 30);
  const nav = (l: number) => Math.floor(l / (30 / 9)) % 12; // නවාංශය
  const planets = Object.fromEntries(Object.entries(lons).map(([k, v]) => [k, sign(v)])) as Record<PlanetKey, number>;
  const navamsa = Object.fromEntries(Object.entries(lons).map(([k, v]) => [k, nav(v)])) as Record<PlanetKey, number>;
  const nakLen = 360 / 27;

  return {
    lagna: sign(asc),
    planets,
    navamsaLagna: nav(asc),
    navamsa,
    nakshatra: Math.floor(lons.moon / nakLen),
    pada: Math.floor((lons.moon % nakLen) / (nakLen / 4)) + 1,
    source: "generated",
    birth: { date: input.date, time: input.time, place: input.place ?? "" },
    updated_at: new Date().toISOString(),
  };
}
