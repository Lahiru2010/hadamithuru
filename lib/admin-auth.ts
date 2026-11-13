// lib/admin-auth.ts
// SERVER: Admin ද / Super admin ද කියලා බලනවා (database එකේ "admins" table එකෙන්)
//  - super_admin: හැමදේම (users මකන්න, admins එකතු කරන්න / අයින් කරන්න)
//  - admin: verify / support / reports — users මකන්න බෑ
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { isAdminEmail } from "@/lib/admin-emails";

export type AdminRole = "super_admin" | "admin";

export async function getAdminInfo(): Promise<{ id: string; email: string; role: AdminRole } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string; email?: string } | undefined;
  if (!claims?.sub || !claims.email) return null;

  const { data: row, error } = await createAdminClient()
    .from("admins")
    .select("role")
    .ilike("email", claims.email)
    .maybeSingle();

  if (row?.role === "super_admin" || row?.role === "admin") return { id: claims.sub, email: claims.email, role: row.role };
  // admins table එක තාම නැත්නම් (SQL run කරලා නැත්නම්) — code එකේ list එකේ ඉන්න අය super admin
  if (error && isAdminEmail(claims.email)) return { id: claims.sub, email: claims.email, role: "super_admin" };
  return null;
}

/** Admin (ඕනම role එකක්) නම් user id එක, නැත්නම් null */
export async function getAdminId(): Promise<string | null> {
  return (await getAdminInfo())?.id ?? null;
}

/** Super admin නම් user id එක, නැත්නම් null */
export async function getSuperAdminId(): Promise<string | null> {
  const info = await getAdminInfo();
  return info?.role === "super_admin" ? info.id : null;
}
