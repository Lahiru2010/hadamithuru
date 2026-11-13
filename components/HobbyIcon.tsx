// components/HobbyIcon.tsx
// හැම විනෝදාංශයකටම ගැලපෙන icon එකක් (Wizard එකේ chips සහ profile popup එක දෙකේම)
import {
  BookOpen, Mic, Music, Sparkles, ChefHat, Film, Plane, Camera, Tv, Trophy,
  Dumbbell, Sprout, Palette, PenLine, PersonStanding, Waves, Heart,
} from "lucide-react";

// 🏏 Cricket bat + ball (lucide එකේ cricket icon එකක් නැති නිසා අපිම හැදුවා — අනිත් icons වගේම line style)
function CricketBat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13.5 5.5 18.5 10.5 9 20a2.1 2.1 0 0 1-3-3z" />
      <path d="M16 8 19 5" />
      <path d="m19 5 2-2" strokeWidth="3" />
      <circle cx="6" cy="6" r="2.2" />
    </svg>
  );
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  reading: BookOpen,
  singing: Mic,
  music: Music,
  dancing: Sparkles,
  cooking: ChefHat,
  "watching movies": Film,
  movies: Film,
  travelling: Plane,
  traveling: Plane,
  photography: Camera,
  "watching tv": Tv,
  cricket: CricketBat,
  sports: Trophy,
  gym: Dumbbell,
  fitness: Dumbbell,
  gardening: Sprout,
  art: Palette,
  drawing: Palette,
  painting: Palette,
  writing: PenLine,
  yoga: PersonStanding,
  swimming: Waves,
};

export default function HobbyIcon({ hobby, className = "h-4 w-4" }: { hobby: string; className?: string }) {
  const key = hobby.trim().toLowerCase();
  // හරියටම ගැලපෙන එකක් නැත්නම් වචනයේ කොටසකින් හොයනවා (උදා: "Book reading")
  const Icon = ICONS[key] ?? Object.entries(ICONS).find(([k]) => key.includes(k))?.[1] ?? Heart;
  return <Icon className={className} aria-hidden="true" />;
}
