// app/api/support/notify/route.ts — 📲 update-68: Customer support එකට user කෙනෙක් message එකක් එව්වම admin ගේ WhatsApp එකට ඒක යවනවා
// CallMeBot (නොමිලේ, තමන්ගේම WhatsApp එකට alerts) — https://www.callmebot.com/blog/free-api-whatsapp-messages/
// Vercel env vars:
//   CALLMEBOT_PHONE   — message එන ඔයාගේ WhatsApp අංකය (උදා: 94716543234 — 0 නැතුව, රටේ අංකය එක්ක)
//   CALLMEBOT_APIKEY  — CallMeBot එකෙන් WhatsApp එකට එවන API key එක
//   SUPPORT_WA_SHOW_TEXT=false → message එකේ text එක නැතුව "අලුත් message එකක්" කියලා විතරක් (පෞද්ගලිකත්වයට)
// POST { id } — SupportChat එකෙන් message එක save වුණාට පස්සේ
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const phone = process.env.CALLMEBOT_PHONE?.replace(/[^\d]/g, "") ?? "";
  const apikey = process.env.CALLMEBOT_APIKEY?.trim() ?? "";
  if (!phone || !apikey) return NextResponse.json({ ok: true, skipped: "not_configured" });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub as string | undefined;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const admin = createAdminClient();
  // 🔒 තමන්ගේම, අලුත් (මිනිත්තු 2ක් ඇතුළත) user message එකක්ද කියලා බලනවා
  const { data: m } = await admin.from("support_messages").select("id, content, created_at").eq("id", id).eq("user_id", uid).eq("sender", "user").maybeSingle();
  if (!m || Date.now() - new Date(m.created_at).getTime() > 120_000) return NextResponse.json({ ok: true, skipped: "not_found" });

  // 🛑 Spam නවත්වන්න: එක user කෙනෙක්ගෙන් පැයකට WhatsApp alerts 15ක් විතරයි
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("support_messages").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("sender", "user").gte("created_at", hourAgo);
  if ((count ?? 0) > 15) return NextResponse.json({ ok: true, skipped: "rate_limited" });

  const { data: p } = await admin.from("profiles").select("full_name, email").eq("id", uid).maybeSingle();
  const who = `${p?.full_name || "Member"}${p?.email ? ` (${p.email})` : ""}`;
  const showText = process.env.SUPPORT_WA_SHOW_TEXT !== "false";
  const content = String(m.content ?? "");
  const text = [
    "💬 *Hadamithuru – Customer support*",
    `👤 ${who}`,
    "",
    showText ? (content.length > 700 ? content.slice(0, 700) + "…" : content) : "අලුත් message එකක් ආවා.",
    "",
    `↩️ Reply: ${SITE_URL}/admin?tab=support`,
  ].join("\n");

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!r.ok) console.warn("[support-wa] callmebot", r.status);
  } catch (e) {
    console.warn("[support-wa] failed", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
