// lib/bookmarks.ts
// 🔖 Bookmarks — මුළු site එකටම එකම තැනක්.
// Bookmark කරපු profile IDs ටික memory එකේ තියාගන්නවා. ඒ නිසා popup එක ආයේ open කළාම
// බොත්තම ගමන්ම "Bookmark කළා" විදිහට පේනවා, Interests → Bookmarks tab එකත් ඒ ගමන්ම update වෙනවා.
"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { createClient } from "@/lib/client";

type Store = { userId: string; ids: Set<string> };

let store: Store | null = null; // null = තාම load කරලා නෑ
let pending: Promise<Store | null> | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

// 👇 Account එක මාරු වුණාම පරණ bookmarks අමතක කරනවා
if (typeof window !== "undefined") {
  createClient().auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      store = null;
      pending = null;
      notify();
    }
  });
}

// 👇 Login වෙලා ඉන්න user ගේ bookmarks එක පාරක් ගන්නවා (එකම වෙලාවේ කීප පාරක් ඉල්ලුවත් request එක එකයි)
export function loadBookmarks(force = false): Promise<Store | null> {
  if (force) pending = null;
  if (!pending) {
    pending = (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;
      const { data, error } = await sb.from("bookmarks").select("profile_id").eq("user_id", user.id);
      if (error) {
        console.error("[bookmarks] load failed:", error.message);
        return { userId: user.id, ids: new Set<string>() };
      }
      return { userId: user.id, ids: new Set((data ?? []).map((r) => r.profile_id as string)) };
    })().then((s) => {
      store = s;
      notify();
      return s;
    });
  }
  return pending;
}

// 👇 Bookmark එක දානවා / අයින් කරනවා. සාර්ථක නම් null, නැත්නම් error message එක.
export async function setBookmark(profileId: string, on: boolean): Promise<string | null> {
  const s = store ?? (await loadBookmarks());
  if (!s) return "Not signed in";
  const had = s.ids.has(profileId);
  // Optimistic — UI එක ගමන්ම වෙනස් වෙනවා
  if (on) s.ids.add(profileId); else s.ids.delete(profileId);
  notify();

  const sb = createClient();
  const { error } = on
    ? await sb.from("bookmarks").upsert({ user_id: s.userId, profile_id: profileId }, { onConflict: "user_id,profile_id", ignoreDuplicates: true })
    : await sb.from("bookmarks").delete().eq("user_id", s.userId).eq("profile_id", profileId);

  if (error) {
    console.error("[bookmarks] save failed:", error.message);
    // ආපහු කලින් තිබ්බ විදිහට
    if (had) s.ids.add(profileId); else s.ids.delete(profileId);
    notify();
    return error.message;
  }
  // Interests page එකේ Bookmarks tab එකට කියනවා
  window.dispatchEvent(new CustomEvent("bookmarks-changed", { detail: { profileId, bookmarked: on } }));
  return null;
}

// 👇 Component එකක පාවිච්චි කරන්න: const { bookmarked, toggle } = useBookmark(profile.id)
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};

export function useBookmark(profileId: string | undefined, enabled = true) {
  const bookmarked = useSyncExternalStore(
    subscribe,
    () => !!(profileId && store?.ids.has(profileId)),
    () => false,
  );
  const ready = useSyncExternalStore(subscribe, () => store !== null, () => false);

  // මුල් පාරට bookmarks load කරනවා (දැනටමත් තියෙනවා නම් ආයේ ගන්නේ නෑ)
  useEffect(() => {
    if (enabled && !store) loadBookmarks();
  }, [enabled]);

  const toggle = useCallback(async () => {
    if (!profileId) return null;
    return setBookmark(profileId, !store?.ids.has(profileId));
  }, [profileId]);

  return { bookmarked: enabled && bookmarked, ready, toggle };
}
