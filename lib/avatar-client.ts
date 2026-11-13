// lib/avatar-client.ts
// Browser එකේ (client components) පාවිච්චි කරන්න.
// Profiles list එකකට ඉක්මනින් load වෙන photo links එකවර ගන්නවා.

export async function fetchAvatarUrls(userIds: string[]): Promise<Record<string, string | null>> {
  if (userIds.length === 0) return {};
  try {
    const res = await fetch("/api/avatar/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.urls ?? {};
  } catch {
    return {};
  }
}

/** Profiles list එකේ avatar_url එක ඉක්මන් links වලින් මාරු කරනවා */
export async function withFastAvatars<T extends { id: string; avatar_url?: string | null }>(profiles: T[]): Promise<T[]> {
  const urls = await fetchAvatarUrls(profiles.map((p) => p.id));
  return profiles.map((p) => ({ ...p, avatar_url: urls[p.id] ?? p.avatar_url }));
}