// app/api/chat/conversation/route.ts
// DELETE { userId } → 🗑️ Chat list එකෙන් කෙනෙක්ව සම්පූර්ණයෙන්ම අයින් කරනවා:
//   • දෙදෙනා අතර හැම message එකක්ම DB එකෙන් මකනවා (දෙපැත්තෙන්ම)
//   • ඒ chat එකේ photos / voice notes storage එකෙනුත් මකනවා
//   • ගැලපීම (match) ඉවත් කරනවා — නැත්නම් list එකේ ආයේ පේනවා
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const other = String(body?.userId ?? "");
  if (!UUID.test(other) || other === me) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const admin = createAdminClient();
  const pair = `and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`;

  // 1) Files (photos / voice) — storage එකෙන්
  const { data: msgs, error: listErr } = await admin.from("messages").select("*").or(pair);
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  const images = (msgs ?? []).map((m) => m.image_path).filter(Boolean) as string[];
  const voices = (msgs ?? []).map((m) => (m as { audio_path?: string | null }).audio_path).filter(Boolean) as string[];
  if (images.length) await admin.storage.from("chat-images").remove(images);
  if (voices.length) await admin.storage.from("chat-voice").remove(voices);

  // 2) Messages — DB එකෙන්
  const { error: delErr } = await admin.from("messages").delete().or(pair);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // 3) Match එක ඉවත් කරනවා (Interests page එකේ "Remove" එක වගේම)
  await admin.from("interests").update({ status: "removed" }).eq("status", "accepted").or(pair);
  // 4) 📞 දුරකථන අංක share කිරීම් දෙපැත්තෙන්ම අයින් කරනවා
  await admin.from("phone_shares").delete().or(`and(owner_id.eq.${me},viewer_id.eq.${other}),and(owner_id.eq.${other},viewer_id.eq.${me})`);

  return NextResponse.json({ ok: true, deleted: msgs?.length ?? 0 });
}
