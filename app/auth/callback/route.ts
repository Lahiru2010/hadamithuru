// app/auth/callback/route.ts
// Google / Facebook login, email confirm link, password reset link — ඔක්කොම මෙතනට එනවා.
// Login එක සම්පූර්ණ කරලා, profile row එක නැත්නම් හදලා, හරි page එකට යවනවා.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // වෙන website එකකට redirect කරන්න බැරි වෙන්න (security)
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth`);

  // Password reset එකක් නම් කෙලින්ම reset page එකට
  if (next === "/reset-password") return NextResponse.redirect(`${origin}/reset-password`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=auth`);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, is_published").eq("id", user.id).maybeSingle();

  // අලුත් user කෙනෙක් නම් profile row එක හදනවා (Google එකෙන් නම ආවොත් ඒකත් දානවා)
  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    await admin.from("profiles").insert({
      id: user.id,
      email: user.email ?? null,
      full_name: (meta.full_name as string) ?? (meta.name as string) ?? null,
      first_name: (meta.given_name as string) ?? null,
      last_name: (meta.family_name as string) ?? null,
    });
    // 🔒 Phone number එක private table එකට
    if (meta.phone) {
      await admin.from("profile_private").upsert({ user_id: user.id, phone: meta.phone as string }, { onConflict: "user_id" });
    }
  }

  // අලුත් user කෙනෙක් නම් wizard එකට, නැත්නම් ඉල්ලපු page එකට (login → Browse)
  const destination = profile ? next : "/profile";
  return NextResponse.redirect(`${origin}${destination}`);
}
