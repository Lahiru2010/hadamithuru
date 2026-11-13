// app/api/admin/support/route.ts — 🛡️ ADMIN ONLY
// GET               → සංවාද list එක (user අනුව, අන්තිම message + නොකියවපු ගණන + අන්තිම සක්‍රිය / login වෙලාව)
// GET ?userId=...   → ඒ user ගේ messages (කියවපු බවට mark කරනවා)
// POST { userId, content } → admin පිළිතුරක්
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = new URL(req.url).searchParams.get("userId");
  const admin = createAdminClient();

  if (userId) {
    const { data } = await admin.from("support_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    await admin.from("support_messages").update({ read_by_admin: true }).eq("user_id", userId).eq("sender", "user").eq("read_by_admin", false);
    return NextResponse.json({ messages: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: rows } = await admin.from("support_messages").select("user_id, sender, content, created_at, read_by_admin").order("created_at", { ascending: false }).limit(1000);
  const threads = new Map<string, { user_id: string; last: string; last_at: string; unread: number }>();
  for (const r of rows ?? []) {
    const t = threads.get(r.user_id) ?? { user_id: r.user_id, last: r.content, last_at: r.created_at, unread: 0 };
    if (r.sender === "user" && !r.read_by_admin) t.unread += 1;
    threads.set(r.user_id, t);
  }
  const ids = [...threads.keys()];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, full_name, email, last_seen_at, last_login_at").in("id", ids) : { data: [] };
  return NextResponse.json({
    threads: [...threads.values()].map((t) => ({ ...t, profile: profiles?.find((p) => p.id === t.user_id) ?? null })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  const content = String(body?.content ?? "").trim().slice(0, 2000);
  if (!userId || !content) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { data, error } = await createAdminClient().from("support_messages").insert({ user_id: userId, sender: "admin", content, read_by_admin: true }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
