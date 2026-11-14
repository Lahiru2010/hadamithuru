// app/api/support/welcome/route.ts — 👋 update-65: අලුත් user කෙනෙක් මුලින්ම Browse page එකට ආවම
//   customer support එකෙන් ඉබේම "සාදරයෙන් පිළිගනිමු — 24/7 උදව් කරන්න ඉන්නවා" message එකක් (එක පාරයි).
// POST { lang } → support_messages එකට admin message එකක් (කලින් කිසිම support message එකක් නැත්නම් විතරයි)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

const NEW_ACCOUNT_DAYS = 3; // 👈 ගිණුම හදලා දින කීයක් ඇතුළතද

const TEXT: Record<string, (name: string) => string> = {
  si: (n) => `👋 ආයුබෝවන්${n ? ` ${n}` : ""}! හදමිතුරු වෙත සාදරයෙන් පිළිගනිමු 💕\n\nඋදව්වක් ඕනෙම නම් අපේ පාරිභෝගික සහාය කණ්ඩායම 24/7 ඔබ වෙනුවෙන් ඉන්නවා. ගිණුම සකස් කරන්න, ගැලපෙන කෙනෙක් සොයන්න හෝ වෙන ඕනම දෙයක් ගැන — මෙතනින්ම අපෙන් අහන්න. 😊`,
  en: (n) => `👋 Hi${n ? ` ${n}` : ""}! Welcome to Hadamithuru 💕\n\nIf you ever need help, our customer support team is here for you 24/7. Setting up your profile, finding a match or anything else — just ask us right here. 😊`,
  ta: (n) => `👋 வணக்கம்${n ? ` ${n}` : ""}! Hadamithuru-க்கு வரவேற்கிறோம் 💕\n\nஉதவி தேவைப்பட்டால் எங்கள் வாடிக்கையாளர் சேவைக் குழு 24/7 உங்களுக்காக இருக்கிறது. சுயவிவரம் அமைப்பது, பொருத்தமானவரைத் தேடுவது அல்லது வேறு எதுவானாலும் — இங்கேயே கேளுங்கள். 😊`,
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const created = user.created_at ? new Date(user.created_at).getTime() : 0;
  if (!created || Date.now() - created > NEW_ACCOUNT_DAYS * 86400_000) return NextResponse.json({ ok: true, skipped: "old" });

  const body = await req.json().catch(() => null);
  const lang = ["si", "en", "ta"].includes(String(body?.lang)) ? String(body.lang) : "si";
  const admin = createAdminClient();
  const { count } = await admin.from("support_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (count) return NextResponse.json({ ok: true, skipped: "exists" }); // 👈 එක පාරයි

  const { data: p } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const first = String(p?.full_name ?? "").trim().split(/\s+/)[0] ?? "";
  const { error } = await admin.from("support_messages").insert({ user_id: user.id, sender: "admin", content: TEXT[lang](first), read_by_admin: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
