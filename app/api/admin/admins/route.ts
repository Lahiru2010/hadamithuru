// app/api/admin/admins/route.ts — 👑 SUPER ADMIN ONLY: admins list / එකතු කරන්න / අයින් කරන්න
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminInfo } from "@/lib/admin-auth";

export const runtime = "nodejs";

async function superOnly() {
  const info = await getAdminInfo();
  return info?.role === "super_admin" ? info : null;
}

export async function GET() {
  if (!(await superOnly())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await createAdminClient().from("admins").select("email, role, created_at").order("created_at");
  return NextResponse.json({ admins: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await superOnly())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = body?.role === "super_admin" ? "super_admin" : "admin";
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  const { error } = await createAdminClient().from("admins").upsert({ email, role }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await superOnly();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (email === me.email.toLowerCase()) return NextResponse.json({ error: "You can't remove yourself" }, { status: 400 });
  await createAdminClient().from("admins").delete().ilike("email", email);
  return NextResponse.json({ ok: true });
}
