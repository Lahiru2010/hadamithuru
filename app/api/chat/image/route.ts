// app/api/chat/image/route.ts
// POST (form-data: file, receiverId, viewOnce) → chat එකට ඡායාරූපයක් යවනවා
// 🔒 ගැලපුණු (accept කරපු) අයට විතරයි, block වෙලා නම් බෑ
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { encodeCompact, IMAGE_EXT, IMAGE_TYPE } from "@/lib/image-encode";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const BUCKET = "chat-images";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const receiverId = String(form.get("receiverId") ?? "");
  const viewOnce = form.get("viewOnce") === "true";
  if (!UUID.test(receiverId) || receiverId === me) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Max 8MB" }, { status: 400 });

  const admin = createAdminClient();

  // ගැලපුණු අය නම් විතරයි
  const { count } = await admin
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${me})`);
  if (!count) return NextResponse.json({ error: "Not matched" }, { status: 403 });

  let image: Buffer;
  try {
    image = await encodeCompact(Buffer.from(await file.arrayBuffer()), 1280); // 👈 AVIF (පොඩිම size එක)
  } catch {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const path = `${me}/${randomUUID()}.${IMAGE_EXT}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, image, { contentType: IMAGE_TYPE });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: msg, error } = await admin
    .from("messages")
    .insert({ sender_id: me, receiver_id: receiverId, content: "📷", image_path: path, view_once: viewOnce })
    .select()
    .single();
  if (error) {
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: error.message.includes("blocked") ? 403 : 500 });
  }
  return NextResponse.json({ message: msg });
}
