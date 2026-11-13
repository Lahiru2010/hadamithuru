// app/api/chat/voice/route.ts
// POST (form-data: file, receiverId, duration) → 🎤 chat එකට හඬ පණිවිඩයක් යවනවා
// 🔒 ගැලපුණු (accept කරපු) අයට විතරයි, block වෙලා නම් බෑ (prevent_blocked_contact trigger එක)
// 💾 Storage ඉතුරු කරන්න: browser එකේම Opus 16 kbps mono විදිහට පටිගත කරනවා → විනාඩියකට ~120 KB
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const BUCKET = "chat-voice";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VOICE_MAX_SECONDS = 120;
const MAX_BYTES = 1.5 * 1024 * 1024; // Safari (AAC) එකේ ටිකක් ලොකු වෙන්න පුළුවන් — ඒත් සාමාන්‍යයෙන් 300 KB ට අඩුයි
// 👇 ඉඩ දෙන audio වර්ග → file extension
const TYPES: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/aac": "aac", "audio/mpeg": "mp3" };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const receiverId = String(form.get("receiverId") ?? "");
  const duration = Math.round(Number(form.get("duration") ?? 0));
  if (!UUID.test(receiverId) || receiverId === me) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Invalid audio" }, { status: 400 });
  const baseType = file.type.split(";")[0].trim().toLowerCase(); // "audio/webm;codecs=opus" → "audio/webm"
  const ext = TYPES[baseType];
  if (!ext) return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
  if (file.size < 500 || file.size > MAX_BYTES) return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  if (!Number.isFinite(duration) || duration < 1 || duration > VOICE_MAX_SECONDS + 2) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });

  const admin = createAdminClient();

  // ගැලපුණු අය නම් විතරයි
  const { count } = await admin
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${me})`);
  if (!count) return NextResponse.json({ error: "Not matched" }, { status: 403 });

  const path = `${me}/${randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: baseType });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: msg, error } = await admin
    .from("messages")
    .insert({ sender_id: me, receiver_id: receiverId, content: "🎤", audio_path: path, audio_duration: Math.min(duration, VOICE_MAX_SECONDS), audio_mime: baseType })
    .select()
    .single();
  if (error) {
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: error.message.includes("blocked") ? 403 : 500 });
  }
  return NextResponse.json({ message: msg });
}
