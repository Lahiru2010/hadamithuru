// app/api/admin/boosts/route.ts — 🛡️ ADMIN: ⚡ Boost ඉල්ලීම්
// GET ?status=pending|active|rejected
// POST { id, action: "activate" | "reject" }   — ගෙවීම ලැබුණාම Activate
// POST { email, days, action: "manual" }       — ඕනෑම කෙනෙක්ව අතින් boost කරන්න (උදා: තෑග්ගක් / ප්‍රවර්ධනයක්)
// GET ?view=live                               — දැන් සක්‍රිය boosts (ඉවර වෙන්න කොච්චර තියෙනවද — progress එකට)
// POST { userId, action: "extend", days }      — සක්‍රිය boost එකක් දින කීපයකින් දිගු කරන්න
// POST { userId, action: "stop" }              — Boost එක දැන්ම නවත්වන්න
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";
type Admin = ReturnType<typeof createAdminClient>;

async function boostUser(admin: Admin, userId: string, days: number, record = false) {
  const { data: p } = await admin.from("profiles").select("boosted_until").eq("id", userId).maybeSingle();
  const from = p?.boosted_until && new Date(p.boosted_until) > new Date() ? new Date(p.boosted_until) : new Date();
  const until = new Date(from.getTime() + days * 86400_000).toISOString();
  const { error } = await admin.from("profiles").update({ boosted_until: until }).eq("id", userId);
  if (error) throw new Error(error.message);
  await admin.from("notifications").insert({ user_id: userId, type: "boost_active", title: "boost_active", body: until, link: "/pricing" });
  // 👇 අතින් / දිගු කළ boosts වලටත් record එකක් (progress එකට පටන් ගත්ත වෙලාව + history)
  if (record) await admin.from("boost_requests").insert({ user_id: userId, days, price_lkr: 0, status: "active", admin_note: "manual", activated_at: new Date().toISOString() });
  return until;
}

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const admin = createAdminClient();

  // ⚡ දැන් සක්‍රිය boosts — පටන් ගත්ත වෙලාව (අන්තිම active ඉල්ලීම) + ඉවර වෙන වෙලාව
  if (url.searchParams.get("view") === "live") {
    const { data: live, error } = await admin.from("profiles").select("id, full_name, email, boosted_until").gt("boosted_until", new Date().toISOString()).order("boosted_until", { ascending: true }).limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const ids = (live ?? []).map((p) => p.id);
    const { data: reqs } = ids.length ? await admin.from("boost_requests").select("user_id, activated_at, days").eq("status", "active").in("user_id", ids).order("activated_at", { ascending: false }) : { data: [] };
    return NextResponse.json({
      live: (live ?? []).map((p) => {
        const last = reqs?.find((r) => r.user_id === p.id);
        // පටන් ගත්ත වෙලාව නොදන්නවා නම් (පරණ boost) — දින 7කට කලින් කියලා ගන්නවා
        const startedAt = last?.activated_at ?? new Date(new Date(p.boosted_until).getTime() - 7 * 86400_000).toISOString();
        return { ...p, started_at: startedAt };
      }),
    }, { headers: { "Cache-Control": "no-store" } });
  }

  const status = url.searchParams.get("status") ?? "pending";
  const { data, error } = await admin.from("boost_requests").select("*").eq("status", status).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = [...new Set((data ?? []).map((r) => r.user_id))];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, full_name, email, boosted_until").in("id", ids) : { data: [] };
  const { data: privs } = ids.length ? await admin.from("profile_private").select("user_id, phone").in("user_id", ids) : { data: [] };
  return NextResponse.json({
    requests: (data ?? []).map((r) => ({ ...r, profile: profiles?.find((p) => p.id === r.user_id) ?? null, phone: privs?.find((p) => p.user_id === r.user_id)?.phone ?? null })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const admin = createAdminClient();
  try {
    if (body?.action === "manual") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const days = Math.min(90, Math.max(1, Number(body?.days) || 7));
      const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (!p) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const until = await boostUser(admin, p.id, days, true);
      return NextResponse.json({ ok: true, until });
    }
    if (body?.action === "extend" || body?.action === "stop") {
      const userId = String(body?.userId ?? "");
      if (!userId) return NextResponse.json({ error: "Invalid" }, { status: 400 });
      if (body.action === "stop") {
        const { error } = await admin.from("profiles").update({ boosted_until: null }).eq("id", userId);
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
      }
      const until = await boostUser(admin, userId, Math.min(90, Math.max(1, Number(body?.days) || 7)), true);
      return NextResponse.json({ ok: true, until });
    }
    const id = String(body?.id ?? "");
    const action = String(body?.action ?? "");
    if (!id || !["activate", "reject"].includes(action)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const { data: r } = await admin.from("boost_requests").select("*").eq("id", id).maybeSingle();
    if (!r || r.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 400 });
    if (action === "activate") await boostUser(admin, r.user_id, r.days);
    await admin.from("boost_requests").update({ status: action === "activate" ? "active" : "rejected", activated_at: action === "activate" ? new Date().toISOString() : null }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
