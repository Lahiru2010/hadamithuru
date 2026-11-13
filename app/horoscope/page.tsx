// app/horoscope/page.tsx — 🔮 මගේ කේන්දරය (සම්පූර්ණ page එක) — UI එක components/HoroscopeEditor.tsx
"use client";

import HoroscopeEditor from "@/components/HoroscopeEditor";

export default function HoroscopePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <HoroscopeEditor />
      </div>
    </main>
  );
}
