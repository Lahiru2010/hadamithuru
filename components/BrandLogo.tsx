// components/BrandLogo.tsx
// 💗 update-48: Hadamithuru logo එක (හදවත + "හද මිතුරු" — Tharu Digital font එකෙන්, අකුරු SVG paths වලට හරවලා)
//   public/logo.svg       → තද maroon අකුරු (සුදු / ලා පසුබිමට)
//   public/logo-white.svg → සුදු අකුරු (dark mode / footer එකේ තද පසුබිමට)
// Font file එක site එකට load කරන්න ඕන නෑ — අකුරු දැනටමත් logo එක ඇතුළේ තියෙනවා.
import Image from "next/image";

// 👇 Logo එකේ පළල : උස = 4.161 : 1
const RATIO = 4.161; // 👈 update-65: හදවතයි අකුරුයි අතර ඉඩ ටිකක් වැඩි කළා

export default function BrandLogo({
  height = 36,
  variant = "auto",
  priority = false,
  className = "",
}: {
  height?: number;
  // "auto"  → light mode එකේ maroon, dark mode එකේ සුදු
  // "white" → හැමවිටම සුදු අකුරු (footer වගේ තද පසුබිමට)
  variant?: "auto" | "white";
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round(height * RATIO);
  const alt = "Hadamithuru – හදමිතුරු";
  if (variant === "white") {
    return <Image src="/logo-white.svg" alt={alt} width={width} height={height} priority={priority} className={className} />;
  }
  return (
    <>
      <Image src="/logo.svg" alt={alt} width={width} height={height} priority={priority} className={`dark:hidden ${className}`} />
      <Image src="/logo-white.svg" alt="" aria-hidden width={width} height={height} priority={priority} className={`hidden dark:block ${className}`} />
    </>
  );
}
