// components/SavedFilters.tsx
// Browse page එකේ filters save කරලා, පස්සේ (ආයේ login වුණාමත්) එක click එකකින් apply කරන්න.
// Save වෙන්නේ Supabase එකේ `saved_filters` table එකේ — ඒ නිසා ඕනම device එකකින් පේනවා.
"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkPlus, Check, Loader2, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/client";
import { useDialog } from "@/components/DialogProvider";
import { useLang } from "@/components/providers";

export type FilterValues = {
  sortBy: string;
  gender: string;
  minAge: string;
  maxAge: string;
  country: string[];
  district: string[];
  education: string[];
  marital: string[];
  religion: string[];
  caste: string[];
  profession: string[];
  income: string;
  food: string;
  drinking: string;
  smoking: string;
  diffAbled: string;
  accCreated: string;
  idVerified: string;
  withPhotos: boolean;
};

type SavedFilter = { id: string; name: string; filters: FilterValues; created_at: string };

const MAX_SAVED = 10;

// එකම filters දෙකක් සසඳන්න (keys පිළිවෙළ වෙනස් වුණත්, lists වල පිළිවෙළ වෙනස් වුණත්)
function filterKey(f: Partial<FilterValues>) {
  const sorted = (arr?: string[]) => [...(arr ?? [])].sort();
  return JSON.stringify([
    f.sortBy ?? "", f.gender ?? "", f.minAge ?? "", f.maxAge ?? "",
    sorted(f.country), sorted(f.district), sorted(f.education), sorted(f.marital),
    sorted(f.religion), sorted(f.caste), sorted(f.profession),
    f.income ?? "", f.food ?? "", f.drinking ?? "", f.smoking ?? "",
    f.diffAbled ?? "", f.accCreated ?? "", f.idVerified ?? "", !!f.withPhotos,
  ]);
}

export default function SavedFilters({
  userId,
  currentFilters,
  hasActiveFilters,
  onApply,
}: {
  userId: string | undefined;
  currentFilters: FilterValues;
  hasActiveFilters: boolean;
  onApply: (filters: FilterValues) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { showConfirm } = useDialog();
  const { t } = useLang();
  const S = t.savedFilters; // 👈 මේ කොටසේ text language එකට අනුව
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save කරපු filters load කරනවා
  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("saved_filters")
      .select("id, name, filters, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(S.loadError);
        else setSaved((data as SavedFilter[]) ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  const currentKey = filterKey(currentFilters);
  const alreadySaved = saved.some((s) => filterKey(s.filters) === currentKey);

  const startSaving = () => {
    setError(null);
    setName(S.defaultName.replace("{n}", String(saved.length + 1)));
    setNaming(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || !userId) return;
    if (saved.length >= MAX_SAVED) return setError(S.maxError.replace("{max}", String(MAX_SAVED)));

    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from("saved_filters")
      .insert({ user_id: userId, name: trimmed.slice(0, 40), filters: currentFilters })
      .select("id, name, filters, created_at")
      .single();
    setBusy(false);

    if (error || !data) return setError(S.saveError);
    setSaved((prev) => [data as SavedFilter, ...prev]);
    setNaming(false);
  };

  const remove = async (item: SavedFilter) => {
    const ok = await showConfirm({
      title: S.deleteTitle.replace("{name}", item.name),
      message: S.deleteMsg,
      confirmText: S.delete,
      cancelText: S.cancel,
      tone: "danger",
    });
    if (!ok) return;
    setSaved((prev) => prev.filter((s) => s.id !== item.id));
    const { error } = await supabase.from("saved_filters").delete().eq("id", item.id);
    if (error) {
      setSaved((prev) => [item, ...prev]);
      setError(S.deleteError);
    }
  };

  if (!userId) return null;

  return (
    <div className="mb-4 pb-4 border-b border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Bookmark className="h-4 w-4 text-primary" /> {S.title}
        </span>

        {!naming && (
          <button
            type="button"
            onClick={startSaving}
            disabled={!hasActiveFilters || alreadySaved}
            title={
              !hasActiveFilters
                ? S.needFilters
                : alreadySaved
                  ? S.alreadySaved
                  : S.saveCurrent
            }
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <BookmarkPlus className="h-4 w-4" /> {S.save}
          </button>
        )}
      </div>

      {/* නමක් දාලා save කරන කොටස */}
      {naming && (
        <div className="mb-3 flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setNaming(false);
            }}
            maxLength={40}
            placeholder={S.placeholder}
            className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy || !name.trim()}
            aria-label={S.save}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setNaming(false)}
            aria-label={S.cancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Save කරපු filters list එක */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
        </div>
      ) : saved.length === 0 ? (
        !naming && (
          <p className="text-xs text-muted-foreground">
            {S.hintBefore} <span className="font-semibold text-primary">{S.save}</span>{S.hintAfter}
          </p>
        )
      ) : (
        <ul className="space-y-1.5">
          {saved.map((item) => {
            const isActive = filterKey(item.filters) === currentKey;
            return (
              <li key={item.id} className="group/item flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onApply(item.filters)}
                  title={S.apply}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  {isActive ? <Check className="h-4 w-4 shrink-0" /> : <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="truncate">{item.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label={`Delete ${item.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
