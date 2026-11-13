// app/api/avatar/batch/route.ts
// POST { userIds: [...] }  →  { urls: { [userId]: "photo link" } }
// Messages වගේ pages වලට photos කිහිපයක් එකවර, ඉක්මනින් load කරන්න.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { getAvatarUrls } from "@/lib/avatar-urls";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = (claimsData?.claims?.sub as string | undefined) ?? null;
  if (!viewerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const userIds: string[] = Array.isArray(body?.userIds)
    ? [...new Set<string>(body.userIds.filter((id: unknown) => typeof id === "string" && UUID.test(id)))].slice(0, 100)
    : [];

  if (userIds.length === 0) return NextResponse.json({ urls: {} });

  const urls = await getAvatarUrls(viewerId, userIds);
  return NextResponse.json({ urls }, { headers: { "Cache-Control": "no-store" } });
}