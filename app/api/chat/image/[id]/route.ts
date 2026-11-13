// app/api/chat/image/[id]/route.ts
// GET → chat ඡායාරූපය (chat එකේ දෙන්නාට විතරයි)
// "View once" නම්: ලබන්නාට එක් වරක් විතරයි, බැලුවම file එකම මකනවා. යවපු කෙනාටත් පේන්නේ නෑ (WhatsApp වගේ).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const BUCKET = "chat-images";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("messages")
    .select("id, sender_id, receiver_id, image_path, view_once, viewed_at, is_deleted")
    .eq("id", id)
    .maybeSingle();

  if (!msg || !msg.image_path || msg.is_deleted) return new NextResponse("Not found", { status: 404 });
  if (msg.sender_id !== me && msg.receiver_id !== me) return new NextResponse("Not found", { status: 404 });

  if (msg.view_once) {
    if (msg.sender_id === me) return new NextResponse("View once", { status: 403 });
    if (msg.viewed_at) return new NextResponse("Gone", { status: 410 });
  }

  // 👇 සාමාන්‍ය photos: Supabase CDN එකේ signed link එකට redirect කරනවා (server එක හරහා bytes යවනවට වඩා ගොඩක් ඉක්මන්)
  if (!msg.view_once) {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(msg.image_path, 60 * 60);
    if (!signed?.signedUrl) return new NextResponse("Gone", { status: 410 });
    return NextResponse.redirect(signed.signedUrl, { status: 302, headers: { "Cache-Control": "private, max-age=3000" } });
  }

  const { data: file, error } = await admin.storage.from(BUCKET).download(msg.image_path);
  if (error || !file) return new NextResponse("Gone", { status: 410 });
  const bytes = Buffer.from(await file.arrayBuffer());

  if (msg.view_once) {
    // 👇 එක් වරක් බැලුවා — වෙලාව දාලා file එක මකනවා
    await admin.from("messages").update({ viewed_at: new Date().toISOString() }).eq("id", msg.id);
    await admin.storage.from(BUCKET).remove([msg.image_path]);
  }

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": file.type || "image/avif",
      "Cache-Control": msg.view_once ? "no-store" : "private, max-age=3600",
    },
  });
}
