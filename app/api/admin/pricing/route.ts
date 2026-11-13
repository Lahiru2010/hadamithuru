// app/api/admin/pricing/route.ts — 🛡️ ADMIN: පැකේජ මිල / පහසුකම් + Boost මිල / දින වෙනස් කරනවා
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";
import { normalizePricing } from "@/lib/pricing";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const value = normalizePricing(body);
  const { error } = await createAdminClient().from("app_settings").upsert({ key: "pricing", value, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, value });
}
