// lib/avatar-urls.ts
// SERVER එකේ විතරයි පාවිච්චි කරන්න.
// User ලා කිහිප දෙනෙක්ගේ profile photos වලට එකවර signed links හදනවා.
// බලන කෙනාට (viewer) අනුව original ද blur ද කියලා මෙතනම තීරණය කරනවා.
import { createAdminClient } from "@/lib/admin";

const PHOTO_LINK_SECONDS = 60 * 60; // පැය 1යි

type PhotoTarget = { bucket: "avatars" | "avatars-original"; path: string };

export async function getAvatarUrls(viewerId: string, userIds: string[]) {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: accepted }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, avatar_url, avatar_original_path, avatar_public_path, avatar_blur_enabled, photo_original_path, photo_blurred_path, blur_photo")
      .in("id", userIds),
    admin
      .from("interests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${viewerId},receiver_id.eq.${viewerId}`),
  ]);

  const acceptedIds = new Set(
    (accepted || []).map((i) => (i.sender_id === viewerId ? i.receiver_id : i.sender_id))
  );

  // හැම කෙනෙකුටම පේන්න ඕන photo file එක තෝරනවා
  const targets = new Map<string, PhotoTarget>();
  for (const p of profiles || []) {
    const usesNew = !!p.avatar_original_path;
    const blurOn = usesNew ? !!p.avatar_blur_enabled : !!p.blur_photo;
    const canSeeOriginal = !blurOn || p.id === viewerId || acceptedIds.has(p.id);

    if (usesNew) {
      const path = canSeeOriginal ? p.avatar_original_path : p.avatar_public_path;
      if (path) targets.set(p.id, { bucket: canSeeOriginal ? "avatars-original" : "avatars", path });
    } else if (p.photo_original_path) {
      const path = canSeeOriginal ? p.photo_original_path : p.photo_blurred_path;
      if (path) targets.set(p.id, { bucket: "avatars", path });
    }
  }

  // Bucket එකකට එක request එකකින් signed links හදනවා
  const signed = new Map<string, string>();
  await Promise.all(
    (["avatars", "avatars-original"] as const).map(async (bucket) => {
      const paths = [...targets.values()].filter((t) => t.bucket === bucket).map((t) => t.path);
      if (paths.length === 0) return;
      const { data } = await admin.storage.from(bucket).createSignedUrls(paths, PHOTO_LINK_SECONDS);
      for (const item of data || []) {
        if (item.signedUrl && item.path) signed.set(`${bucket}/${item.path}`, item.signedUrl);
      }
    })
  );

  // userId → photo URL (signed link එකක් නැත්නම් avatar_url එකම)
  const urls: Record<string, string | null> = {};
  for (const p of profiles || []) {
    const t = targets.get(p.id);
    urls[p.id] = (t && signed.get(`${t.bucket}/${t.path}`)) || p.avatar_url || null;
  }
  return urls;
}