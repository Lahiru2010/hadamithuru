// app/api/photos/route.ts
// අමතර photos (profile photo එකට අමතරව උපරිම 4ක්)
//  GET  /api/photos?userId=...  → බලන්න අවසර තියෙනවා නම් photos (signed links), නැත්නම් ගණන විතරයි
//  POST /api/photos             → අලුත් photo එකක් upload කරනවා (තමන්ගේ profile එකට)
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { encodeCompact, IMAGE_EXT, IMAGE_TYPE } from "@/lib/image-encode";
import { getAdminId } from "@/lib/admin-auth";
import { MAX_EXTRA_PHOTOS, GALLERY_BUCKET, canViewPrivatePhotos } from "@/lib/photo-access";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getViewerId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";
  const metaOnly = url.searchParams.get("meta") === "1"; // 👈 ගණන + අවසරය විතරක් (ඉක්මන් — skeleton එකට)
  if (!UUID.test(userId)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  // Photos list එකයි accept status එකයි එකවර (parallel) ගන්නවා — ඉක්මන්
  const [{ data: rows }, allowed] = await Promise.all([
    admin
      .from("profile_photos")
      .select("id, path, position, created_at")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    // 👇 Admin ට හැමදේම — admin dashboard එකෙන් (?admin=1) විතරයි. Browse කරනකොට අනිත් අයට වගේම 🔒
    url.searchParams.get("admin") === "1" && (await getAdminId()) ? Promise.resolve(true) : canViewPrivatePhotos(admin, viewerId, userId),
  ]);

  const photos = rows ?? [];
  const noStore = { headers: { "Cache-Control": "no-store" } };

  // 🔒 අවසර නැත්නම් photos යවන්නේ නෑ — කීයක් තියෙනවද කියලා විතරයි
  if (!allowed) return NextResponse.json({ locked: true, count: photos.length, photos: [] }, noStore);
  if (metaOnly || photos.length === 0) return NextResponse.json({ locked: false, count: photos.length, photos: [] }, noStore);

  const { data: signed } = await admin.storage.from(GALLERY_BUCKET).createSignedUrls(photos.map((p) => p.path), 60 * 60);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return NextResponse.json(
    {
      locked: false,
      count: photos.length,
      photos: photos.map((p) => ({ id: p.id, url: urlByPath.get(p.path) ?? null })).filter((p) => p.url),
    },
    noStore
  );
}

export async function POST(req: Request) {
  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/"))
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin.from("profile_photos").select("id", { count: "exact", head: true }).eq("user_id", viewerId);
  if ((count ?? 0) >= MAX_EXTRA_PHOTOS)
    return NextResponse.json({ error: `You can add up to ${MAX_EXTRA_PHOTOS} more photos.` }, { status: 400 });

  let image: Buffer;
  try {
    image = await encodeCompact(Buffer.from(await file.arrayBuffer()), 1280); // 👈 AVIF (පොඩිම size එක)
  } catch {
    return NextResponse.json({ error: "Please upload a JPG, PNG or WEBP image" }, { status: 400 });
  }

  const path = `${viewerId}/gallery/${randomUUID()}.${IMAGE_EXT}`;
  const { error: upErr } = await admin.storage.from(GALLERY_BUCKET).upload(path, image, { contentType: IMAGE_TYPE });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: row, error } = await admin
    .from("profile_photos")
    .insert({ user_id: viewerId, path, position: count ?? 0 })
    .select("id")
    .single();
  if (error || !row) {
    await admin.storage.from(GALLERY_BUCKET).remove([path]);
    return NextResponse.json({ error: error?.message ?? "Save failed" }, { status: 500 });
  }

  const { data: signed } = await admin.storage.from(GALLERY_BUCKET).createSignedUrl(path, 60 * 60);
  return NextResponse.json({ id: row.id, url: signed?.signedUrl ?? null });
}
