// app/api/admin/stories/route.ts — 🛡️ ADMIN: Success stories සමාලෝචනය
// GET ?status=pending|approved|rejected
// POST { id, action: "approve" | "reject" | "unpublish", note? }
// POST { id, action: "update", names, place, married_year, story, show_in_slider }   — text වෙනස් කරන්න / slider එකේ පෙන්නනවද
// POST { id, action: "gift" }                                                        — 🎁 තෑග්ග යැව්වා කියලා සලකුණු කරන්න
// POST { id, action: "delete" }                                                      — admin හදපු slide එකක් මකන්න
// POST (multipart: names, place, married_year, story, photo)                          — ➕ Admin slider එකට අලුත් slide එකක්
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";
import { randomUUID } from "crypto";
import { encodeCompact, IMAGE_EXT, IMAGE_TYPE } from "@/lib/image-encode";

export const runtime = "nodejs";
const BUCKET = "success-stories";

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const admin = createAdminClient();
  const q = admin.from("success_stories").select("*").eq("status", status);
  const { data, error } = await (status === "approved" ? q.order("sort_order", { ascending: true }).order("reviewed_at", { ascending: false }) : q.order("created_at", { ascending: false })).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = [...new Set((data ?? []).map((s) => s.user_id))];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const paths = (data ?? []).map((s) => s.photo_path).filter(Boolean) as string[];
  const { data: signed } = paths.length ? await admin.storage.from(BUCKET).createSignedUrls(paths, 600) : { data: [] };
  const url = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
  return NextResponse.json({
    stories: (data ?? []).map((s) => ({ ...s, photo_url: s.photo_path ? url.get(s.photo_path) ?? null : s.image_url ?? null, profile: profiles?.find((p) => p.id === s.user_id) ?? null })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const adminId = await getAdminId();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();

  // ➕ Admin slider slide (photo එක්ක)
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const form = await req.formData();
    const names = String(form.get("names") ?? "").trim().slice(0, 80);
    const story = String(form.get("story") ?? "").trim().slice(0, 700);
    if (names.length < 3 || story.length < 10) return NextResponse.json({ error: "Names and text are required" }, { status: 400 });
    let photoPath: string | null = null;
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      const img = await encodeCompact(Buffer.from(await photo.arrayBuffer()), 1400).catch(() => null);
      if (!img) return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
      photoPath = `admin/${randomUUID()}.${IMAGE_EXT}`;
      const { error } = await admin.storage.from(BUCKET).upload(photoPath, img, { contentType: IMAGE_TYPE });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { error } = await admin.from("success_stories").insert({
      user_id: adminId, names, place: String(form.get("place") ?? "").slice(0, 60) || null,
      married_year: Number(form.get("married_year")) || null, story, photo_path: photoPath,
      consent: true, married: true, status: "approved", is_custom: true, show_in_slider: true,
      partner_confirmed_at: new Date().toISOString(), reviewed_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const action = String(body?.action ?? "");
  if (!id) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (action === "update") {
    const patch: Record<string, unknown> = {};
    if (typeof body.names === "string") patch.names = body.names.trim().slice(0, 80);
    if (typeof body.place === "string") patch.place = body.place.trim().slice(0, 60) || null;
    if (body.married_year !== undefined) patch.married_year = Number(body.married_year) || null;
    if (typeof body.story === "string") patch.story = body.story.trim().slice(0, 700);
    if (typeof body.show_in_slider === "boolean") patch.show_in_slider = body.show_in_slider;
    if (Number.isInteger(body.sort_order)) patch.sort_order = body.sort_order;
    const { error } = await admin.from("success_stories").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "gift") {
    const { error } = await admin.from("success_stories").update({ gift_sent_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    const { data: row } = await admin.from("success_stories").select("photo_path, is_custom").eq("id", id).maybeSingle();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 }); // 👈 update-46: ඕනෑම slide / කතාවක් මකන්න පුළුවන්
    if (row.photo_path) await admin.storage.from(BUCKET).remove([row.photo_path]);
    await admin.from("success_stories").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (!["approve", "reject", "unpublish"].includes(action)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending";
  const { data: s, error } = await admin.from("success_stories").update({ status, admin_note: body?.note ? String(body.note).slice(0, 300) : null, reviewed_at: new Date().toISOString() }).eq("id", id).select("user_id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (action === "approve" && s) await admin.from("notifications").insert({ user_id: s.user_id, type: "story_approved", title: "story_approved", link: "/" });
  return NextResponse.json({ ok: true });
}
