// lib/photo-access.ts
// SERVER එකේ විතරයි. අමතර photos බලන්න පුළුවන්ද? → තමන්ම හෝ interest එක accept වෙලා තියෙන අයට විතරයි.
import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_EXTRA_PHOTOS = 4; // Profile photo එකත් එක්ක උපරිම 5යි
export const GALLERY_BUCKET = "avatars-original"; // Private bucket එක

export async function canViewPrivatePhotos(admin: SupabaseClient, viewerId: string | null, ownerId: string) {
  if (!viewerId) return false;
  if (viewerId === ownerId) return true;
  const { count } = await admin
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`and(sender_id.eq.${viewerId},receiver_id.eq.${ownerId}),and(sender_id.eq.${ownerId},receiver_id.eq.${viewerId})`);
  return (count ?? 0) > 0;
}
