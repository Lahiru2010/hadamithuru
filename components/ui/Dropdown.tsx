// components/ui/Dropdown.tsx
// Browser එකේ default <select> එක වෙනුවට site එකේ design එකට ගැලපෙන dropdown එක (Language, Sort By වගේ තැන් වලට)
"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: string; hint?: string };

export default function Dropdown({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
  align = "left",
  className = "",
  buttonClassName = "",
  labelClassName = "",
  placeholder,
  fullWidth = false,
  disabled = false,
  invalid = false,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  ariaLabel?: string;
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  /** 👇 update-48: Button එකේ label text එකට classes (උදා: phone එකේ හංගන්න "hidden sm:inline") */
  labelClassName?: string;
  /** Value එක හිස් නම් පේන text එක (form වල "තෝරන්න…") */
  placeholder?: string;
  /** Form එකක input එකක් වගේ සම්පූර්ණ පළලට, උස */
  fullWidth?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? (placeholder ? null : options[0]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const choose = (v: string) => { onChange(v); setOpen(false); };
  const listRef = useRef<HTMLUListElement>(null);
  // 👇 List එක document.body එකට portal කරලා button එකට යටින් fixed විදිහට තියනවා —
  //    "overflow: hidden" කොටුවක් ඇතුළේ තිබුණත් කැපෙන්නේ නෑ. යට ඉඩ මදි නම් උඩට open වෙනවා.
  const [pos, setPos] = useState<{ top: number; left: number; width: number; up: boolean; maxH: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 8;
      const above = r.top - 8;
      const up = below < 220 && above > below;
      const maxH = Math.max(160, Math.min(288, (up ? above : below) - 8));
      setPos({ top: up ? r.top - 8 : r.bottom + 8, left: r.left, width: r.width, up, maxH });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [open]);
  useEffect(() => {
    if (open) listRef.current?.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "nearest" });
  }, [open]);
  const openList = () => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); openList(); return; }
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); choose(options[active].value); }
        }}
        className={`flex items-center gap-2 rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
          fullWidth
            ? `h-12 w-full justify-between bg-muted/30 px-4 ${invalid ? "border-red-500" : open ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`
            : "h-9 border-border bg-background px-3 font-medium shadow-sm hover:border-primary/40 hover:bg-muted/40"
        } ${buttonClassName}`}
      >
        {icon}
        <span className={`truncate ${fullWidth ? "flex-1 text-left" : ""} ${current ? "" : "text-muted-foreground"} ${labelClassName}`}>{current?.label ?? placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && createPortal(
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          style={{
            position: "fixed",
            top: pos.up ? undefined : pos.top,
            bottom: pos.up ? document.documentElement.clientHeight - pos.top : undefined,
            left: fullWidth ? pos.left : align === "right" ? undefined : pos.left,
            right: !fullWidth && align === "right" ? document.documentElement.clientWidth - (pos.left + pos.width) : undefined,
            width: fullWidth ? pos.width : undefined,
            minWidth: fullWidth ? undefined : pos.width,
            maxHeight: pos.maxH,
          }}
          className={`z-[200] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background py-1 shadow-xl animate-in fade-in duration-150 custom-scrollbar ${fullWidth ? "" : "w-max max-w-[18rem]"}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.value)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${i === active ? "bg-muted/60" : ""} ${selected ? "font-semibold text-primary" : "text-foreground"}`}
                >
                  <span className="flex-1">{o.label}</span>
                  {o.hint && <span className="text-xs text-muted-foreground">{o.hint}</span>}
                  <Check className={`h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
