// app/api/photos/[id]/route.ts
// DELETE → තමන්ගේ අමතර photo එකක් අයින් කරනවා
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { GALLERY_BUCKET } from "@/lib/photo-access";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const viewerId = (data?.claims?.sub as string | undefined) ?? null;
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: photo } = await admin.from("profile_photos").select("id, user_id, path").eq("id", id).maybeSingle();
  // තමන්ගේ photo එකක් නම් විතරයි
  if (!photo || photo.user_id !== viewerId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.storage.from(GALLERY_BUCKET).remove([photo.path]);
  await admin.from("profile_photos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
