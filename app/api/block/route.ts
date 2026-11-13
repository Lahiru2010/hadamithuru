// app/api/block/route.ts
// POST   { userId } → block කරනවා (දෙන්නා අතර interests / match එකත් අයින් කරනවා)
// DELETE { userId } → unblock කරනවා
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getIds(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  const body = await req.json().catch(() => null);
  const other = typeof body?.userId === "string" ? body.userId : "";
  return { me, other };
}

export async function POST(req: Request) {
  const { me, other } = await getIds(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!UUID.test(other) || other === me) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blocks").upsert({ blocker_id: me, blocked_id: other }, { onConflict: "blocker_id,blocked_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // දෙපැත්තේම interests / match අයින් කරනවා
  await admin
    .from("interests")
    .update({ status: "removed" })
    .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
    .in("status", ["pending", "accepted"]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { me, other } = await getIds(req);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!UUID.test(other)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const { error } = await createAdminClient().from("blocks").delete().eq("blocker_id", me).eq("blocked_id", other);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
