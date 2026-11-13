// app/api/admin/premium/route.ts — 🛡️ ADMIN: 💎 Premium සාමාජිකයින්
// GET → දැන් Premium අය (ඉවර වෙන දිනය + පටන් ගත්ත දිනය progress එකට)
// POST { email, months, action: "grant" } → Premium දෙනවා / දිගු කරනවා · { userId, action: "revoke" } → දැන්ම නවත්වනවා
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("id, full_name, email, premium_until, founding_member, founding_number").gt("premium_until", new Date().toISOString()).order("premium_until", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data ?? []).map((p) => p.id);
  const { data: grants } = ids.length ? await admin.from("premium_grants").select("user_id, reason, months, created_at").in("user_id", ids).order("created_at", { ascending: false }) : { data: [] };
  return NextResponse.json({
    members: (data ?? []).map((p) => {
      const last = grants?.find((g) => g.user_id === p.id);
      return { ...p, reason: last?.reason ?? null, started_at: last?.created_at ?? null };
    }),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const admin = createAdminClient();
  if (body?.action === "revoke") {
    const { error } = await admin.from("profiles").update({ premium_until: null }).eq("id", String(body?.userId ?? ""));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const months = Math.min(24, Math.max(1, Number(body?.months) || 1));
  const { data: p } = await admin.from("profiles").select("id, premium_until").ilike("email", email).maybeSingle();
  if (!p) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const from = p.premium_until && new Date(p.premium_until) > new Date() ? new Date(p.premium_until) : new Date();
  const until = new Date(from);
  until.setMonth(until.getMonth() + months);
  const { error } = await admin.from("profiles").update({ premium_until: until.toISOString() }).eq("id", p.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("premium_grants").insert({ user_id: p.id, reason: "admin", months });
  return NextResponse.json({ ok: true, until: until.toISOString() });
}
