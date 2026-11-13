// app/api/verify/route.ts
// GET  → මගේ තහවුරු කිරීමේ checklist එක + අන්තිම ඉල්ලීම
// POST → හැඳුනුම්පත් photos (form-data: docType, front, back?, selfie) යවනවා
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { encodeCompact, IMAGE_EXT, IMAGE_TYPE } from "@/lib/image-encode";

export const runtime = "nodejs";
const BUCKET = "verification-docs";

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const [{ data: profile }, { data: priv }, { data: req }] = await Promise.all([
    admin.from("profiles").select("id_verified, avatar_url").eq("id", user.id).maybeSingle(),
    admin.from("profile_private").select("phone").eq("user_id", user.id).maybeSingle(),
    admin.from("verification_requests").select("id, status, admin_note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return NextResponse.json({
    checklist: {
      email: !!user.email_confirmed_at,
      phone: !!priv?.phone,
      photo: !!profile?.avatar_url,
      id: profile?.id_verified === "Yes",
    },
    request: req ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const docType = String(form.get("docType") ?? "");
  const front = form.get("front");
  const back = form.get("back");
  const selfie = form.get("selfie");
  if (!["nic", "passport", "license"].includes(docType)) return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  const isImg = (f: unknown): f is File => f instanceof File && f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024;
  // Selfie එක අනිවාර්ය නෑ (PC වල selfie ගන්න අමාරුයි) — ඉදිරිපස + (NIC / license නම්) පිටුපස ඇති
  if (!isImg(front) || (docType !== "passport" && !isImg(back))) return NextResponse.json({ error: "Please add all photos" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin.from("verification_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending");
  if (count) return NextResponse.json({ error: "Already under review" }, { status: 409 });

  const upload = async (f: File, name: string) => {
    const path = `${user.id}/${randomUUID()}-${name}.${IMAGE_EXT}`;
    const buf = await encodeCompact(Buffer.from(await f.arrayBuffer()), 1600, 60); // කියවන්න පුළුවන් වෙන්න ටිකක් වැඩි quality
    const { error } = await admin.storage.from(BUCKET).upload(path, buf, { contentType: IMAGE_TYPE });
    if (error) throw error;
    return path;
  };

  try {
    const [frontPath, backPath, selfiePath] = await Promise.all([
      upload(front, "front"),
      isImg(back) ? upload(back, "back") : Promise.resolve(null),
      isImg(selfie) ? upload(selfie, "selfie") : Promise.resolve(null),
    ]);
    const { error } = await admin.from("verification_requests").insert({
      user_id: user.id, doc_type: docType, front_path: frontPath, back_path: backPath, selfie_path: selfiePath,
    });
    if (error) throw error;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
