// app/api/contact/route.ts — 📮 "අප අමතන්න" form එක (update-59)
// POST { name, email, phone?, topic, message, lang?, website? } → contact_messages table එකට
//   • Login නැති අයටත් පුළුවන් · login නම් user_id එකත් save වෙනවා
//   • "website" කියන හැංගුණු field එක පිරිලා නම් = bot → නිකම්ම ok කියනවා (save කරන්නේ නෑ)
//   • එකම IP එකෙන් පැයකට 5කට වඩා බෑ
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

const TOPICS = ["general", "account", "payment", "safety", "feedback", "other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // 🤖 Bot එකක් නම් (හැංගුණු field එක පුරවලා) — save නොකර "ok"
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true });

  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 160);
  const phone = String(body.phone ?? "").trim().slice(0, 30) || null;
  const topic = TOPICS.includes(String(body.topic)) ? String(body.topic) : "general";
  const message = String(body.message ?? "").trim().slice(0, 3000);
  const lang = ["si", "en", "ta"].includes(String(body.lang)) ? String(body.lang) : null;
  if (name.length < 2 || !EMAIL.test(email) || message.length < 10) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // 👤 Login වෙලා නම් user id එක
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    userId = (data?.claims?.sub as string | undefined) ?? null;
  } catch { /* login නැති අය */ }

  // 🧂 IP එක hash කරලා විතරයි (ඇත්ත IP එක save කරන්නේ නෑ)
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`hadamithuru:${ip}`).digest("hex").slice(0, 32);

  const admin = createAdminClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "too_many" }, { status: 429 });

  const { error } = await admin.from("contact_messages").insert({ name, email, phone, topic, message, lang, user_id: userId, ip_hash: ipHash });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
