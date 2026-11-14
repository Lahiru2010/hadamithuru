// components/CoupleSlider.tsx
// Home page එකේ couple photos slider එක: මැද photo එක ලොකුවට, දෙපැත්තේ ඇලවෙලා.
// මැද ඉන්න යුවළගේ ආදර කතාව (review) යටින්. Auto යනවා, ඒ වගේම ← → buttons / dots වලින් මාරු කරන්නත් පුළුවන්.
"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MapPin, Quote } from "lucide-react";
import CoupleImage from "@/components/CoupleImage";

export type CoupleStory = { name: string; place: string; quote: string; year: number; img: string };

const AUTO_MS = 3000; // 👈 තත්පර 3න් 3ට මාරු වෙනවා

export default function CoupleSlider({ stories, marriedLabel, prevLabel, nextLabel, badge }: { stories: CoupleStory[]; marriedLabel: string; prevLabel: string; nextLabel: string; badge?: string }) {
  const n = stories.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // 👇 Phone එකද (640px ට අඩු)
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + n) % n), [n]);

  // 👇 Auto slide — හැම slide එකකටම පස්සේ timer එක අලුතින් පටන් ගන්නවා (setTimeout), ඒ නිසා කවදාවත් හිරවෙන්නේ නෑ.
  //    නවතින්නේ: computer mouse එක slider එක උඩ තියෙනකොට, හෝ browser tab එක පේන්නේ නැතිකොට විතරයි.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    if (paused || hidden || n < 2) return;
    const id = setTimeout(() => go(1), AUTO_MS);
    return () => clearTimeout(id);
  }, [index, paused, hidden, go, n]);

  // හැම card එකක්ම මැද එකට සාපේක්ෂව කොහෙද කියලා — එකපාර photos 5ක් (මැද + දෙපැත්තට 2 බැගින්)
  const position = (k: number) => {
    const offset = (k - index + n) % n;
    if (offset === 0) return "center";
    if (offset === 1) return "right";
    if (offset === n - 1) return "left";
    // Phone එකේ ඈත photos පෙන්නන්නේ නෑ (ඉඩ මදි — කැපිලා පේන්න එපා)
    if (offset === 2) return isSmall ? "hidden" : "farRight";
    if (offset === n - 2) return isSmall ? "hidden" : "farLeft";
    return "hidden";
  };

  const STYLE: Record<string, React.CSSProperties> = {
    center: { transform: "translate(-50%, -50%) scale(1)", opacity: 1, zIndex: 30 },
    // 👇 දුර vw වලින් — screen එක පොඩි වුණාම photos ළං වෙනවා, ඒ නිසා කෙළවරේ photos කැපෙන්නේ නෑ
    left: { transform: "translate(calc(-50% - min(17rem, 21vw)), -48%) rotate(-5deg) scale(0.84)", opacity: 0.95, zIndex: 20 },
    right: { transform: "translate(calc(-50% + min(17rem, 21vw)), -48%) rotate(5deg) scale(0.84)", opacity: 0.95, zIndex: 20 },
    farLeft: { transform: "translate(calc(-50% - min(31rem, 33vw)), -45%) rotate(-8deg) scale(0.64)", opacity: 0.8, zIndex: 10 },
    farRight: { transform: "translate(calc(-50% + min(31rem, 33vw)), -45%) rotate(8deg) scale(0.64)", opacity: 0.8, zIndex: 10 },
    hidden: { transform: "translate(-50%, -45%) scale(0.5)", opacity: 0, zIndex: 0 },
  };

  const story = stories[index];

  return (
    <div
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Photos */}
      {/* 👇 overflow-x-clip — දෙපැත්තේ photos නිසා page එක පැත්තට scroll වෙන්නේ නෑ */}
      <div className="relative mx-auto h-[26rem] w-full overflow-x-clip sm:h-[34rem]">
        {stories.map((s, k) => {
          const pos = position(k);
          return (
            <button
              key={s.img}
              type="button"
              aria-label={s.name}
              tabIndex={pos === "hidden" ? -1 : 0}
              onClick={() => (pos === "left" ? go(-1) : pos === "right" ? go(1) : pos === "farLeft" ? go(-2) : pos === "farRight" ? go(2) : undefined)}
              className="absolute left-1/2 top-1/2 h-80 w-60 overflow-hidden rounded-[2rem] shadow-2xl ring-4 ring-background transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:h-[30rem] sm:w-[22rem]"
              style={STYLE[pos]}
            >
              <CoupleImage src={s.img} alt={s.name} className="h-full w-full" />
              {/* 👇 මැද photo එකේ පහළින්: "කසුන් ♥ දිලිනි" + ස්ථානය · විවාහ වූ වර්ෂය */}
              {pos === "center" && (() => {
                const [a, b] = s.name.split(/\s*(?:&|සහ)\s*/);
                return (
                  <span key={index} className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-6 pt-20 text-white animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <span className="flex items-center gap-2.5 text-xl font-bold tracking-tight drop-shadow sm:text-2xl">
                      <span>{a}</span>
                      {/* 💗 update-54: නම් දෙක මැද logo හදවත — සුදු රවුමක් ඇතුළේ (photo එක උඩ පැහැදිලිව පේන්න) */}
                      {b && <SliderHeart />}
                      {b && <span>{b}</span>}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-white/85 sm:text-sm">
                      <MapPin className="h-3.5 w-3.5" /> {s.place} · {marriedLabel.replace("{year}", String(s.year))}
                    </span>
                  </span>
                );
              })()}
            </button>
          );
        })}

        {/* ← → */}
        <button type="button" onClick={() => go(-1)} aria-label={prevLabel} className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2.5 shadow-lg backdrop-blur transition hover:bg-background sm:left-4">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label={nextLabel} className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2.5 shadow-lg backdrop-blur transition hover:bg-background sm:right-4">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {stories.map((s, k) => (
          <button key={s.img} type="button" aria-label={s.name} onClick={() => setIndex(k)} className={`h-2 rounded-full transition-all ${k === index ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"}`} />
        ))}
      </div>

      {/* 👇 මැද ඉන්න යුවළගේ කතාව — මාරු වෙනකොට animate වෙනවා */}
      {/* 👇 මැද යුවළගේ කතාව — සරල, පිරිසිදු design එකක් (slide එක මාරු වෙනකොට fade වෙනවා) */}
      <figure key={index} className="mx-auto mt-10 max-w-2xl px-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Quote className="mx-auto h-8 w-8 fill-primary/15 text-primary/60" />
        <blockquote className="mt-4 text-lg leading-relaxed text-foreground/90 sm:text-xl">{story.quote}</blockquote>
        <figcaption className="mt-4 text-sm font-semibold text-muted-foreground">{story.name} · {story.place}</figcaption>
      </figure>
    </div>
  );
}

// 💗 update-54: Slider එකේ නම් දෙක මැද හදවත — විදිහ මාරු කරන්න මේ එක වචනය වෙනස් කරන්න:
//   "badge" → සුදු රවුමක් ඇතුළේ logo හදවත (default)
//   "glass" → වීදුරු වගේ විනිවිද පේන රවුමක් ඇතුළේ logo හදවත
//   "white" → සරල සුදු හදවතක්
const SLIDER_HEART: "badge" | "glass" | "white" = "badge";

function SliderHeart() {
  if (SLIDER_HEART === "white") return <Heart aria-hidden className="h-6 w-6 shrink-0 fill-white text-white drop-shadow sm:h-7 sm:w-7" />;
  const ring = SLIDER_HEART === "badge"
    ? "bg-white shadow-lg shadow-black/30 ring-4 ring-white/20"
    : "bg-white/20 backdrop-blur-md ring-1 ring-white/50 shadow-lg shadow-black/20";
  return (
    <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${ring}`}>
      <Image src="/logo-mark.svg" alt="" width={24} height={24} className="h-[22px] w-[22px] sm:h-6 sm:w-6" />
    </span>
  );
}
