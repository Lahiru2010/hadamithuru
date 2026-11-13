// app/api/horoscope/match/route.ts — 💞 කේන්දර ගැළපීම (මූලික) — අනිත් කෙනාගේ කේන්දරය නොපෙන්වා ලකුණු විතරයි
// GET ?userId=X&lang=si → { mine, theirs, result? } — 🔒 ගැලපුණු (accept කරපු) අයට විතරයි (photos වගේම)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import { fullPorondam, isHoroscope } from "@/lib/porondam";

export const runtime = "nodejs";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = (data?.claims?.sub as string | undefined) ?? null;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const other = new URL(req.url).searchParams.get("userId") ?? "";
  if (!UUID.test(other) || other === uid) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  const admin = createAdminClient();
  const noStoreEarly = { headers: { "Cache-Control": "no-store" } };
  const { count } = await admin.from("interests").select("id", { count: "exact", head: true }).eq("status", "accepted")
    .or(`and(sender_id.eq.${uid},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${uid})`);
  if (!count) {
    // 🔒 ගැලපිලා නැත්නම් කේන්දරය / ලකුණු නෑ — "කේන්දරයක් දාලා තියෙනවද" කියන එක විතරයි
    const { data: theirRow } = await admin.from("profile_private").select("*").eq("user_id", other).maybeSingle();
    return NextResponse.json({ mine: false, theirs: isHoroscope((theirRow as { horoscope?: unknown } | null)?.horoscope), matched: false }, noStoreEarly);
  }
  const lang = new URL(req.url).searchParams.get("lang") ?? "si";
  const [{ data: privs }, { data: profs }] = await Promise.all([
    admin.from("profile_private").select("*").in("user_id", [uid, other]),
    admin.from("profiles").select("id, gender").in("id", [uid, other]),
  ]);
  const h = (id: string) => (privs?.find((p) => p.user_id === id) as { horoscope?: unknown } | undefined)?.horoscope;
  const mine = h(uid), theirs = h(other);
  const noStore = { headers: { "Cache-Control": "no-store" } };
  if (!isHoroscope(mine) || !isHoroscope(theirs)) return NextResponse.json({ mine: isHoroscope(mine), theirs: isHoroscope(theirs) }, noStore);

  const g = (id: string) => String(profs?.find((p) => p.id === id)?.gender ?? "").toLowerCase();
  // ගැහැණු / පිරිමි — නොදන්නවා නම් මම ගැහැණු කෙනා ලෙස (ගණනය සමමිතික නොවෙන නිසා)
  const iAmGirl = g(uid) === "female" || (g(uid) !== "male" && g(other) === "male");
  const result = fullPorondam(mine, theirs, iAmGirl, lang);
  return NextResponse.json({ mine: true, theirs: true, result }, noStore);
}
