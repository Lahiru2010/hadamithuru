// app/api/admin/summary/route.ts — 🛡️ ADMIN ONLY: අලුත් දේවල් ගණන (tabs / navbar dot එකට)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const [{ count: pending }, { count: unread }, { count: reports }] = await Promise.all([
    admin.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("support_messages").select("id", { count: "exact", head: true }).eq("sender", "user").eq("read_by_admin", false),
    admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  // ⚡ Boost ඉල්ලීම් (table එක තාම නැත්නම් 0)
  const { count: boosts } = await admin.from("boost_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
  const { count: stories } = await admin.from("success_stories").select("id", { count: "exact", head: true }).eq("status", "pending");
  return NextResponse.json({ pendingVerifications: pending ?? 0, unreadSupport: unread ?? 0, openReports: reports ?? 0, pendingBoosts: boosts ?? 0, pendingStories: stories ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
