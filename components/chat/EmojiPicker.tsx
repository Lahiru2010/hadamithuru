// components/chat/EmojiPicker.tsx — 😊 Chat එකට emoji දාන පොඩි panel එක (අලුත් library එකක් නැතුව)
// නිතර පාවිච්චි කරන ඒවා උඩින්ම මතක තියාගන්නවා (browser එකේ).
"use client";

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";
import { useLang } from "@/components/providers";

const GROUPS: { icon: string; emojis: string[] }[] = [
  { icon: "😊", emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😌 😍 🥰 😘 😗 😚 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 😐 😑 😶 😏 😒 🙄 😬 😔 😪 😴 😷 🤒 🥴 😵 🥳 😎 🤓 😕 😟 🙁 😮 😯 😲 😳 🥺 😢 😭 😱 😖 😞 😓 😩 😫 😤 😡".split(" ") },
  { icon: "❤️", emojis: "❤️ 🧡 💛 💚 💙 💜 🤍 🤎 🖤 💖 💗 💓 💞 💕 💘 💝 💟 ❣️ 💌 💋 💑 💏 👫 💍 💐 🌹 🥀 😻 💯 ✨".split(" ") },
  { icon: "👍", emojis: "👍 👎 👌 ✌️ 🤞 🤝 🙏 👏 🙌 👐 🤲 👋 🤙 💪 👀 🫶 ☝️ 👇 👉 👈 🫡 🙋‍♀️ 🙋‍♂️ 🤷‍♀️ 🤷‍♂️ 💁‍♀️ 💁‍♂️".split(" ") },
  { icon: "🎉", emojis: "🎉 🎊 🎈 🎂 🎁 🥂 🍾 🪔 🛕 ⛪ 🕌 🕉️ ☸️ 📿 👰 🤵 👪 🏠 ✈️ 🎓 💼 📚 🎶 📸 ☕ 🍵 🍰 🍛 🍚 🥥".split(" ") },
  { icon: "🌸", emojis: "🌸 🌺 🌻 🌼 🌷 🪷 🌿 🍀 🌴 🌊 🌙 ⭐ 🌟 ☀️ 🌈 ☁️ 🌧️ 🐘 🦚 🐶 🐱 🦋 🐝 🍎 🥭 🍌 🍍 🍉".split(" ") },
];
const RECENT_KEY = "seneha_recent_emojis";

export default function EmojiPicker({ onPick, disabled = false }: { onPick: (emoji: string) => void; disabled?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // 👇 Panel එක open කරනකොට (click එකේදීම) නිතර පාවිච්චි කරපු ඒවා කියවනවා
  const toggle = () => {
    if (!open) {
      try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 16)); } catch { /* නොසලකා හරිනවා */ }
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const pick = (e: string) => {
    onPick(e);
    const next = [e, ...recent.filter((x) => x !== e)].slice(0, 16);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* නොසලකා හරිනවා */ }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button type="button" onClick={toggle} disabled={disabled} aria-label={t.chat.emoji} aria-expanded={open} title={t.chat.emoji} className={`shrink-0 rounded-full border p-2.5 sm:p-3 transition disabled:opacity-50 ${open ? "border-primary/50 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}>
        <Smile className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30 px-1">
            {GROUPS.map((g, i) => (
              <button key={g.icon} type="button" onClick={() => setTab(i)} className={`flex-1 py-2 text-lg transition ${tab === i ? "border-b-2 border-primary" : "opacity-60 hover:opacity-100"}`}>{g.icon}</button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto p-2 custom-scrollbar">
            {recent.length > 0 && tab === 0 && (
              <div className="mb-1 grid grid-cols-8 gap-0.5 border-b border-border pb-1">
                {recent.map((e) => <button key={`r-${e}`} type="button" onClick={() => pick(e)} className="rounded-lg p-1 text-xl transition hover:scale-110 hover:bg-muted">{e}</button>)}
              </div>
            )}
            <div className="grid grid-cols-8 gap-0.5">
              {GROUPS[tab].emojis.map((e) => (
                <button key={e} type="button" onClick={() => pick(e)} className="rounded-lg p-1 text-xl transition hover:scale-110 hover:bg-muted">{e}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
