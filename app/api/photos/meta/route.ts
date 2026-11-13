// app/api/photos/meta/route.ts
// POST { userIds: [...] } → { meta: { [userId]: { count, locked } } }
// Interests / Messages pages වල popup එකේ photos කොටස ඒ ගමන්ම පෙන්නන්න (එක request එකකින් හැමෝටම)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.userIds) ? body.userIds.filter((x: unknown) => typeof x === "string" && UUID.test(x)).slice(0, 200) : [];
  if (ids.length === 0) return NextResponse.json({ meta: {} });

  const admin = createAdminClient();
  const [{ data: rows }, { data: accepted }] = await Promise.all([
    admin.from("profile_photos").select("user_id").in("user_id", ids),
    admin
      .from("interests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`),
  ]);

  const matched = new Set((accepted ?? []).map((r) => (r.sender_id === me ? r.receiver_id : r.sender_id)));
  const meta: Record<string, { count: number; locked: boolean }> = {};
  for (const id of ids) meta[id] = { count: 0, locked: id !== me && !matched.has(id) };
  for (const r of rows ?? []) meta[r.user_id].count += 1;

  return NextResponse.json({ meta }, { headers: { "Cache-Control": "no-store" } });
}
