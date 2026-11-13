// app/api/phone/route.ts — 📞 දුරකථන අංකය: **එක එක කෙනාට වෙන වෙනම** (ගැලපුණු අයගෙන් තමන් කැමති අයට විතරයි)
// GET  ?userId=X → { theirPhone, iShare, hasPhone }
//                  theirPhone = X මට අංකය share කරලා නම් විතරයි · iShare = මම X ට share කරලාද · hasPhone = මගේ අංකය තියෙනවද
// POST { userId, share } → මගේ අංකය X ට පෙන්නනවද නැද්ද (ගැලපිලා නම් විතරයි). Default: කාටවත් නෑ
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noStore = { headers: { "Cache-Control": "no-store" } };
type Admin = ReturnType<typeof createAdminClient>;

async function me() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
async function matched(admin: Admin, a: string, b: string) {
  const { count } = await admin
    .from("interests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`);
  return (count ?? 0) > 0;
}

export async function GET(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const other = new URL(req.url).searchParams.get("userId") ?? "";
  if (!UUID.test(other) || other === uid) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  const admin = createAdminClient();
  if (!(await matched(admin, uid, other))) return NextResponse.json({ theirPhone: null, iShare: false, hasPhone: false, matched: false }, noStore);

  const [{ data: shares }, { data: privs }] = await Promise.all([
    admin.from("phone_shares").select("owner_id, viewer_id").or(`and(owner_id.eq.${uid},viewer_id.eq.${other}),and(owner_id.eq.${other},viewer_id.eq.${uid})`),
    admin.from("profile_private").select("user_id, phone").in("user_id", [uid, other]),
  ]);
  const theyShare = (shares ?? []).some((s) => s.owner_id === other);
  const iShare = (shares ?? []).some((s) => s.owner_id === uid);
  const myPhone = privs?.find((p) => p.user_id === uid)?.phone ?? null;
  const theirPhone = theyShare ? privs?.find((p) => p.user_id === other)?.phone ?? null : null;
  return NextResponse.json({ theirPhone, iShare, hasPhone: !!myPhone, matched: true }, noStore);
}

export async function POST(req: Request) {
  const uid = await me();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const other = String(body?.userId ?? "");
  const share = body?.share === true;
  if (!UUID.test(other) || other === uid) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  const admin = createAdminClient();
  if (share && !(await matched(admin, uid, other))) return NextResponse.json({ error: "Not matched" }, { status: 403 });
  const { error } = share
    ? await admin.from("phone_shares").upsert({ owner_id: uid, viewer_id: other }, { onConflict: "owner_id,viewer_id", ignoreDuplicates: true })
    : await admin.from("phone_shares").delete().eq("owner_id", uid).eq("viewer_id", other);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, share });
}
