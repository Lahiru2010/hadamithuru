// app/api/translate/route.ts — 🌐 "මා ගැන" English → සිංහල / தமிழ் auto translate
// POST { text, to: ["si","ta"] } → { si, ta }
// • GOOGLE_TRANSLATE_API_KEY .env එකේ තියෙනවා නම් Google Translate (හොඳම ගුණාත්මකභාවය, මාසෙකට අකුරු 500,000ක් නොමිලේ)
// • නැත්නම් MyMemory (නොමිලේ, key නැතුව — දවසකට සීමාවක් තියෙනවා, ගුණාත්මකභාවය ටිකක් අඩුයි)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export const runtime = "nodejs";
const LANGS = ["si", "ta"] as const;

async function google(text: string, to: string, key: string) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "en", target: to, format: "text" }),
  });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const d = await res.json();
  return String(d?.data?.translations?.[0]?.translatedText ?? "");
}

// MyMemory එකට එක request එකකට අකුරු ~450යි — වාක්‍ය අනුව කෑලි කරනවා
async function myMemory(text: string, to: string) {
  const parts: string[] = [];
  let cur = "";
  for (const s of text.split(/(?<=[.!?\n])\s*/)) {
    if ((cur + " " + s).length > 450 && cur) { parts.push(cur); cur = s; } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) parts.push(cur);
  const out: string[] = [];
  for (const p of parts) {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(p)}&langpair=en|${to}`);
    if (!res.ok) throw new Error(`MyMemory ${res.status}`);
    const d = await res.json();
    out.push(String(d?.responseData?.translatedText ?? ""));
  }
  return out.join(" ");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text ?? "").trim().slice(0, 600);
  const to = (Array.isArray(body?.to) ? body.to : LANGS).filter((l: string) => (LANGS as readonly string[]).includes(l)) as string[];
  if (text.length < 2 || !to.length) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  try {
    const results = await Promise.all(to.map(async (l) => [l, key ? await google(text, l, key) : await myMemory(text, l)] as const));
    return NextResponse.json(Object.fromEntries(results), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Translate failed" }, { status: 502 });
  }
}
