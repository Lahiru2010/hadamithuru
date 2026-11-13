// app/api/chat/voice/[id]/route.ts
// GET    → 🎤 හඬ පණිවිඩය (chat එකේ දෙන්නාට විතරයි) — Supabase CDN signed link එකට redirect
// DELETE → යවපු කෙනා message එක මකනකොට audio file එකත් storage එකෙන් මකනවා (ඉඩ ඉතුරු කරන්න)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const BUCKET = "chat-voice";

async function load(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return { me: null, msg: null, admin: null };
  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("messages")
    .select("id, sender_id, receiver_id, audio_path, is_deleted")
    .eq("id", id)
    .maybeSingle();
  return { me, msg, admin };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, msg, admin } = await load(id);
  if (!me || !admin) return new NextResponse("Unauthorized", { status: 401 });
  if (!msg || !msg.audio_path || msg.is_deleted) return new NextResponse("Gone", { status: 410 });
  if (msg.sender_id !== me && msg.receiver_id !== me) return new NextResponse("Not found", { status: 404 });

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(msg.audio_path, 60 * 60);
  if (!signed?.signedUrl) return new NextResponse("Gone", { status: 410 });
  return NextResponse.redirect(signed.signedUrl, { status: 302, headers: { "Cache-Control": "private, max-age=3000" } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { me, msg, admin } = await load(id);
  if (!me || !admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!msg || msg.sender_id !== me) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await admin.from("messages").update({ is_deleted: true }).eq("id", msg.id);
  if (msg.audio_path) await admin.storage.from(BUCKET).remove([msg.audio_path]);
  return NextResponse.json({ ok: true });
}
