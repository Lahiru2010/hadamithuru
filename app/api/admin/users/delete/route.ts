// app/api/admin/users/delete/route.ts — 👑 SUPER ADMIN ONLY: user කෙනෙක්ව සම්පූර්ණයෙන්ම මකනවා
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminInfo } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const me = await getAdminInfo();
  if (me?.role !== "super_admin") return NextResponse.json({ error: "Only the super admin can delete users" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  if (!userId || userId === me.id) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  const admin = createAdminClient();
  // Profile row එක මුලින් (foreign key එකක් තිබුණත් අවුලක් නැති වෙන්න), ඊට පස්සේ login account එක
  await admin.from("profiles").delete().eq("id", userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
