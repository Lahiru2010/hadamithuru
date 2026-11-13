// lib/nav-profile.ts
// SERVER එකේ විතරයි. Page එක server එකෙන් එනකොටම navbar එකට ඕන
// user ගේ නම සහ photo link එක ලෑස්ති කරනවා (browser එකේ load වෙනකම් ඉන්න ඕන නෑ).
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { getAvatarUrls } from "@/lib/avatar-urls";

export type NavUser = { id: string; email: string | null };
export type NavProfile = { full_name: string | null; avatar_url: string | null };

export async function getNavData(): Promise<{ user: NavUser | null; profile: NavProfile | null }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    const userId = (claims?.sub as string | undefined) ?? null;
    if (!userId) return { user: null, profile: null };

    const user: NavUser = { id: userId, email: (claims?.email as string | undefined) ?? null };

    const admin = createAdminClient();
    const [{ data: p }, urls] = await Promise.all([
      admin.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
      getAvatarUrls(userId, [userId]),
    ]);

    if (!p) return { user, profile: null };
    return { user, profile: { full_name: p.full_name, avatar_url: urls[userId] ?? p.avatar_url } };
  } catch {
    // මොකක් හරි වැරදුණොත් navbar එක පරණ විදිහටම browser එකේදී load කරනවා
    return { user: null, profile: null };
  }
}