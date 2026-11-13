// app/api/stories/route.ts — 💍 Success stories
// GET  → approved කතා (හැමෝටම — home page එකට), photos වලට පැය 24ක links
// POST → ලොග් වුණ user කෙනෙක් කතාවක් එවනවා (status = pending → admin approve කළාම පළ වෙනවා)
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { encodeCompact, IMAGE_EXT, IMAGE_TYPE } from "@/lib/image-encode";

export const runtime = "nodejs";
const BUCKET = "success-stories";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("success_stories")
    .select("id, names, place, married_year, story, photo_path, image_url, sort_order, reviewed_at")
    .eq("status", "approved")
    .eq("show_in_slider", true) // 👈 Admin "slider එකේ පෙන්නන්න" කියපු ඒවා විතරයි
    .order("sort_order", { ascending: true })
    .order("reviewed_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ stories: [] }); // 👈 SQL එක තාම නැත්නම් — home එකේ sample කතා පේනවා
  const paths = (data ?? []).map((s) => s.photo_path).filter(Boolean) as string[];
  const { data: signed } = paths.length ? await admin.storage.from(BUCKET).createSignedUrls(paths, 86400) : { data: [] };
  const url = new Map((signed ?? []).map((x) => [x.path, x.signedUrl]));
  return NextResponse.json(
    { stories: (data ?? []).map((s) => ({ id: s.id, names: s.names, place: s.place, year: s.married_year, story: s.story, photo: s.photo_path ? url.get(s.photo_path) ?? null : (s as { image_url?: string | null }).image_url ?? null })) },
    { headers: { "Cache-Control": "no-store" } }, // 👈 Admin වෙනස් කළ ගමන් home එකේ පේන්න
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const me = (claims?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const names = String(form.get("names") ?? "").trim().slice(0, 80);
  const place = String(form.get("place") ?? "").trim().slice(0, 60) || null;
  const year = Number(form.get("year") ?? 0) || null;
  const story = String(form.get("story") ?? "").trim().slice(0, 700);
  const partnerId = String(form.get("partnerId") ?? "");
  const consent = form.get("consent") === "true";
  const photo = form.get("photo");
  const married = form.get("married") === "true";
  if (names.length < 3 || story.length < 30 || !consent || !married) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (!UUID.test(partnerId)) return NextResponse.json({ error: "Choose your partner" }, { status: 400 });

  const admin = createAdminClient();
  // 💞 සහකරු Seneha හරහාම ගැලපුණු කෙනෙක් වෙන්නම ඕනේ (accept කරපු interest එකක්)
  const { count: matched } = await admin.from("interests").select("id", { count: "exact", head: true }).in("status", ["accepted", "removed"])
    .or(`and(sender_id.eq.${me},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me})`);
  if (!matched) return NextResponse.json({ error: "Partner must be someone you matched with on Seneha" }, { status: 403 });
  // 👇 එකවර pending කතා 3කට වඩා එවන්න බෑ (spam නවත්තන්න)
  const { count } = await admin.from("success_stories").select("id", { count: "exact", head: true }).eq("user_id", me).eq("status", "pending");
  if ((count ?? 0) >= 3) return NextResponse.json({ error: "Too many pending stories" }, { status: 429 });

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/") || photo.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
    try {
      const img = await encodeCompact(Buffer.from(await photo.arrayBuffer()), 1200);
      photoPath = `${me}/${randomUUID()}.${IMAGE_EXT}`;
      const { error } = await admin.storage.from(BUCKET).upload(photoPath, img, { contentType: IMAGE_TYPE });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } catch {
      return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
    }
  }

  const { data: row, error } = await admin.from("success_stories").insert({
    user_id: me, partner_id: partnerId, names, place, married_year: year, story, photo_path: photoPath, consent: true, married: true,
  }).select("id").single();
  if (error) {
    if (photoPath) await admin.storage.from(BUCKET).remove([photoPath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // (update-36) සහකරු තහවුරු කරන්න ඕන නෑ — දෙදෙනාගෙන් එක්කෙනෙක් එවුවාම කෙලින්ම admin ට
  return NextResponse.json({ ok: true, id: row.id });
}
