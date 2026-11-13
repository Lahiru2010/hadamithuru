// components/DevQuickLogin.tsx
// 🧪 DEV ONLY — Test accounts වලට එක click එකකින් login වෙන්න.
//  - `npm run dev` එකේදී විතරයි පේන්නේ / වැඩ කරන්නේ. Production එකේ මේක පේන්නෙත් නෑ, කිසිවක් save වෙන්නෙත් නෑ.
//  - ඔයා අතින් login වෙන හැම account එකක්ම auto මේ list එකට එකතු වෙනවා (මේ browser එකේ විතරයි).
//  - හැම button එකකම ✕ එකෙන් list එකෙන් අයින් කරන්න පුළුවන්.
// සම්පූර්ණයෙන්ම අයින් කරන්න: මේ file එක delete කරලා, app/login/page.tsx එකේ "DEV ONLY" lines අයින් කරන්න.
"use client";

import { useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";

type TestAccount = { name: string; email: string; password: string };

const IS_DEV = process.env.NODE_ENV === "development";
const SAVED_KEY = "dev_quick_logins";
const HIDDEN_KEY = "dev_quick_logins_hidden";

const BUILT_IN_ACCOUNTS: TestAccount[] = IS_DEV
  ? [
      { name: "Anuruddha", email: "anuruddha@gmail.com", password: "1234567" },
      { name: "Lahiru", email: "lahiru@gmail.com", password: "1234567" },
      { name: "Lahiru Admin", email: "lahiru.cntr@gmail.com", password: "1234567" },
      { name: "Manoshi", email: "manoshi@gmail.com", password: "1234567" },
      { name: "Dilmi", email: "dilmi@gmail.com", password: "1234567" },
    ]
  : [];

function readList<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

/** Login එක සාර්ථක වුණාම call කරන්න — dev mode එකේ විතරක් list එකට එකතු කරනවා */
export function rememberDevLogin(email: string, password: string, name?: string | null) {
  if (!IS_DEV) return;
  const key = email.trim().toLowerCase();
  // Built-in එකක් නම් ආයේ save කරන්න ඕන නෑ (අයින් කරලා තිබුණොත් ආයේ පෙන්නනවා)
  if (BUILT_IN_ACCOUNTS.some((a) => a.email === key)) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(readList<string>(HIDDEN_KEY).filter((e) => e !== key)));
    return;
  }
  const saved = readList<TestAccount>(SAVED_KEY).filter((a) => a.email !== key);
  saved.push({ name: name?.trim() || key.split("@")[0], email: key, password });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
}

export default function DevQuickLogin({
  onSelect,
  disabled = false,
}: {
  onSelect: (email: string, password: string) => void;
  disabled?: boolean;
}) {
  // මේ component එක browser එකේ විතරයි render වෙන්නේ (Providers mount වුණාට පස්සේ), ඒ නිසා localStorage කියවන්න පුළුවන්
  const [saved, setSaved] = useState<TestAccount[]>(() => (IS_DEV ? readList<TestAccount>(SAVED_KEY) : []));
  const [hidden, setHidden] = useState<string[]>(() => (IS_DEV ? readList<string>(HIDDEN_KEY) : []));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "" });

  if (!IS_DEV) return null;

  const accounts = [...BUILT_IN_ACCOUNTS.filter((a) => !hidden.includes(a.email)), ...saved];

  const remove = (acc: TestAccount) => {
    if (BUILT_IN_ACCOUNTS.some((a) => a.email === acc.email)) {
      const next = [...hidden, acc.email];
      setHidden(next);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    } else {
      const next = saved.filter((a) => a.email !== acc.email);
      setSaved(next);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    }
  };

  // 👇 Account එකක් අතින් list එකට එකතු කරන්න
  const addManual = () => {
    if (!draft.email.trim() || !draft.password) return;
    rememberDevLogin(draft.email, draft.password, draft.name);
    setSaved(readList<TestAccount>(SAVED_KEY));
    setHidden(readList<string>(HIDDEN_KEY));
    setDraft({ name: "", email: "", password: "" });
    setAdding(false);
  };

  const reset = () => {
    setSaved([]);
    setHidden([]);
    localStorage.removeItem(SAVED_KEY);
    localStorage.removeItem(HIDDEN_KEY);
  };

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">🧪 Quick login (dev only)</p>
        {(saved.length > 0 || hidden.length > 0) && (
          <button type="button" onClick={reset} title="Reset list" className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground">Log in once with any account and it will appear here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {accounts.map((acc) => (
            <div key={acc.email} className="group relative">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(acc.email, acc.password)}
                title={acc.email}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2 pr-8 text-left text-sm font-medium transition hover:border-primary hover:bg-primary/10 disabled:cursor-wait disabled:opacity-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
                  {acc.name.charAt(0)}
                </span>
                <span className="truncate">{acc.name}</span>
              </button>
              {/* 👇 List එකෙන් අයින් කරන්න */}
              <button
                type="button"
                onClick={() => remove(acc)}
                aria-label={`Remove ${acc.name}`}
                title="Remove from quick login"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground opacity-60 transition hover:bg-red-500/10 hover:text-red-500 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 👇 අතින් එකතු කරන්න */}
      {adding ? (
        <div className="mt-3 grid gap-2">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name (optional)" className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Password" type="text" className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold hover:bg-muted">Cancel</button>
            <button type="button" onClick={addManual} className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-600">Add</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-amber-500/40 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> Add account
        </button>
      )}

      <p className="mt-3 text-center text-[11px] text-muted-foreground">New accounts you register or log in with are added automatically.</p>
    </div>
  );
}
