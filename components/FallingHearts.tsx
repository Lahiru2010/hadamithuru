// components/FallingHearts.tsx
// Home page එකේ උඩ කොටසේ පොඩි hearts හිම වැටෙනවා වගේ වැටිලා පහළදී fade වෙලා යනවා.
// update-25: hero එකේ ඉඳන් couple slider photos වලටත් උඩින් වැටෙනවා (fall = වැටෙන දුර)
// "Reduce motion" on කරපු අයට animation එක පේන්නේ නෑ.
"use client";

// ස්ථාවර අගයන් (random නැති නිසා server / browser දෙකේම එකම විදිහට)
const HEARTS = [
  { left: 99.5, size: 20, delay: 4.7, dur: 8.2 },
  { left: 4.3, size: 18, delay: 4.4, dur: 8.3 },
  { left: 6.8, size: 16, delay: 1.0, dur: 10.1 },
  { left: 9.3, size: 34, delay: 5.1, dur: 12.1 },
  { left: 12.4, size: 22, delay: 7.6, dur: 10.9 },
  { left: 15.5, size: 28, delay: 0.6, dur: 9.1 },
  { left: 20.4, size: 20, delay: 3.5, dur: 8.7 },
  { left: 22.4, size: 24, delay: 6.7, dur: 11.4 },
  { left: 25.8, size: 22, delay: 4.5, dur: 10.7 },
  { left: 29.0, size: 16, delay: 7.4, dur: 10.5 },
  { left: 33.8, size: 26, delay: 5.6, dur: 12.6 },
  { left: 36.7, size: 22, delay: 9.5, dur: 11.5 },
  { left: 39.7, size: 24, delay: 6.3, dur: 12.4 },
  { left: 44.5, size: 24, delay: 7.3, dur: 8.4 },
  { left: 47.2, size: 20, delay: 9.1, dur: 8.8 },
  { left: 50.5, size: 16, delay: 11.5, dur: 8.4 },
  { left: 54.1, size: 26, delay: 4.1, dur: 9.8 },
  { left: 57.3, size: 30, delay: 0.8, dur: 8.5 },
  { left: 60.0, size: 18, delay: 0.7, dur: 11.5 },
  { left: 64.5, size: 30, delay: 3.4, dur: 9.9 },
  { left: 67.9, size: 16, delay: 11.3, dur: 9.8 },
  { left: 71.1, size: 30, delay: 0.7, dur: 11.8 },
  { left: 73.0, size: 22, delay: 4.8, dur: 12.6 },
  { left: 77.5, size: 20, delay: 5.4, dur: 10.7 },
  { left: 82.0, size: 28, delay: 10.4, dur: 9.4 },
  { left: 84.0, size: 26, delay: 8.2, dur: 9.9 },
  { left: 86.8, size: 18, delay: 2.1, dur: 9.2 },
  { left: 90.2, size: 30, delay: 10.0, dur: 8.9 },
  { left: 93.7, size: 20, delay: 5.0, dur: 9.8 },
  { left: 97.9, size: 20, delay: 8.3, dur: 10.6 },
];

export default function FallingHearts({ fall = "95vh", className = "" }: { fall?: string; className?: string }) {
  const mask = "linear-gradient(to bottom, black 0%, black 80%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden ${className}`}
      // පහළටම එනකොට fade වෙලා යන්න
      style={{ maskImage: mask, WebkitMaskImage: mask, ["--seneha-fall" as string]: fall } as React.CSSProperties}
    >
      <style href="falling-hearts" precedence="default">
        {`@keyframes seneha-heart-fall {
  0%   { transform: translateY(-40px) translateX(0) rotate(-10deg); opacity: 0; }
  10%  { opacity: .85; }
  50%  { transform: translateY(calc(var(--seneha-fall) * .5)) translateX(18px) rotate(12deg); }
  100% { transform: translateY(var(--seneha-fall)) translateX(-12px) rotate(-8deg); opacity: 0; }
}`}
      </style>
      {HEARTS.map((h, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute top-0 text-[#D52047]/50 dark:text-[#D52047]/40"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            animation: `seneha-heart-fall ${h.dur}s linear ${h.delay}s infinite`,
            opacity: 0,
          }}
        >
          <path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.2 4.5 6 4.5c2.2 0 3.6 1.3 4.4 2.5h3.2c.8-1.2 2.2-2.5 4.4-2.5 3.8 0 5.6 4 4 7.2C19.5 16.4 12 21 12 21z" />
        </svg>
      ))}
    </div>
  );
}
