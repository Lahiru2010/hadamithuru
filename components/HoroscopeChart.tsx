// components/HoroscopeChart.tsx — 🔮 ලංකාවේ කේන්දර සටහන (කොටු 12 — 3×3 කොටු, කෙළවරේ කොටු හතර විකර්ණයෙන් දෙකට)
// භාව අංක ස්ථාවරයි: 1 උඩ මැද, ඊට පස්සේ වාමාවර්තව (2,3 උඩ වම … 12 උඩ දකුණ). මැද: ලග්නය.
// (ලබාදුන් ජ්‍යෝතිෂ කේන්දරයේ සැලැස්මටම)
"use client";

import { PLANETS, PLANET_SHORT, SIGNS, type PlanetKey } from "@/lib/porondam";

const S = 100; // එක කොටුවක ප්‍රමාණය (මුළු සටහන 300×300)
// 👇 භාව 1–12: polygon එක + planets ලියන තැන + අංකය ලියන තැන
const HOUSES: { poly: string; c: [number, number]; n: [number, number] }[] = [
  { poly: "100,0 200,0 200,100 100,100", c: [150, 58], n: [150, 18] },        // 1
  { poly: "0,0 100,0 100,100", c: [68, 34], n: [85, 16] },                    // 2
  { poly: "0,0 0,100 100,100", c: [32, 70], n: [14, 88] },                    // 3
  { poly: "0,100 100,100 100,200 0,200", c: [50, 158], n: [50, 118] },        // 4
  { poly: "0,200 100,200 0,300", c: [30, 232], n: [14, 214] },                // 5
  { poly: "100,200 100,300 0,300", c: [68, 268], n: [86, 288] },              // 6
  { poly: "100,200 200,200 200,300 100,300", c: [150, 258], n: [150, 288] },  // 7
  { poly: "200,200 200,300 300,300", c: [232, 268], n: [214, 288] },          // 8
  { poly: "200,200 300,200 300,300", c: [270, 232], n: [288, 214] },          // 9
  { poly: "200,100 300,100 300,200 200,200", c: [250, 158], n: [250, 118] },  // 10
  { poly: "300,0 300,100 200,100", c: [268, 70], n: [286, 88] },              // 11
  { poly: "200,0 300,0 200,100", c: [232, 34], n: [215, 16] },                // 12
];

export default function HoroscopeChart({ lagna, planets, lang = "si", title, highlight }: {
  lagna: number;
  planets: Record<PlanetKey, number>;
  lang?: string;
  title: string;            // මැද ලියන නම (උදා: "මීන ලග්නය")
  highlight?: PlanetKey | null;
}) {
  const short = PLANET_SHORT[lang] ?? PLANET_SHORT.si;
  return (
    <svg viewBox="-4 -4 308 308" className="h-auto w-full max-w-[22rem] select-none" role="img" aria-label={title}>
      {HOUSES.map((h, i) => {
        const house = i + 1;
        const sign = (lagna + i) % 12;
        const here = PLANETS.filter((p) => planets[p] === sign);
        return (
          <g key={house}>
            <polygon points={h.poly} fill={house === 1 ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "var(--background)"} stroke="var(--foreground)" strokeWidth={2} strokeLinejoin="round" />
            <text x={h.n[0]} y={h.n[1]} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="var(--muted-foreground)">{house}</text>
            <text x={h.c[0]} y={h.c[1]} textAnchor="middle" dominantBaseline="middle" fontSize={here.length > 2 ? 13 : 16} fontWeight="800">
              {here.map((p, k) => (
                <tspan key={p} fill={highlight === p ? "var(--primary)" : "var(--foreground)"} dx={k ? 4 : 0}>{short[p]}</tspan>
              ))}
            </text>
          </g>
        );
      })}
      {/* මැද: ලග්නය */}
      <text x={150} y={142} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--primary)">{(SIGNS[lang] ?? SIGNS.si)[lagna]}</text>
      <text x={150} y={164} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--muted-foreground)">{title}</text>
    </svg>
  );
}
