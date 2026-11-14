// app/api/admin/settings/route.ts — 🛡️ ADMIN: site settings (update-65: WhatsApp අංකය)
// PUT { whatsapp } → app_settings (key = "contact")
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const whatsapp = String(body?.whatsapp ?? "").trim().slice(0, 20);
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: "Enter a valid phone number, e.g. 0716543234" }, { status: 400 });
  const { error } = await createAdminClient().from("app_settings").upsert({ key: "contact", value: { whatsapp }, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, whatsapp });
}
