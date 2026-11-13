// app/api/chat/last-times/route.ts
// GET → { times: { [otherUserId]: "අන්තිම message එකේ වෙලාව" } } — Messages list එකේ "විනාඩි 10කට පෙර" වගේ පෙන්නන්න
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const me = (data?.claims?.sub as string | undefined) ?? null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows, error } = await createAdminClient()
    .from("messages")
    .select("sender_id, receiver_id, created_at")
    .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const times: Record<string, string> = {};
  for (const m of rows ?? []) {
    const other = m.sender_id === me ? m.receiver_id : m.sender_id;
    if (!times[other]) times[other] = m.created_at;
  }
  return NextResponse.json({ times }, { headers: { "Cache-Control": "no-store" } });
}
