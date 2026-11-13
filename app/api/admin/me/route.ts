// app/api/admin/me/route.ts — GET → { role: "super_admin" | "admin" | null }
import { NextResponse } from "next/server";
import { getAdminInfo } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const info = await getAdminInfo();
  return NextResponse.json({ role: info?.role ?? null }, { headers: { "Cache-Control": "no-store" } });
}
