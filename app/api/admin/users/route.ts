// app/api/admin/users/route.ts — 🛡️ ADMIN ONLY
// GET ?days=30 → අලුත් users (verify කරන්න)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 30)));
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, full_name, email, age, gender, city, district, country, created_at, is_published, id_verified, avatar_url")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  const ids = (users ?? []).map((u) => u.id);
  const { data: pending } = ids.length
    ? await admin.from("verification_requests").select("user_id").eq("status", "pending").in("user_id", ids)
    : { data: [] };
  const pendingSet = new Set((pending ?? []).map((p) => p.user_id));
  return NextResponse.json({ users: (users ?? []).map((u) => ({ ...u, has_pending_request: pendingSet.has(u.id) })) }, { headers: { "Cache-Control": "no-store" } });
}
