// app/api/admin/verifications/route.ts — 🛡️ ADMIN ONLY
// GET  ?status=pending → ඉල්ලීම් (හැඳුනුම්පත් photos වල විනාඩි 10ක links එක්ක)
// POST { userId, requestId?, action: "approve" | "reject" | "unverify" | "inform", note?, chatNote? }
//   reject → ඉල්ලීම ප්‍රතික්ෂේප (user ට නැවත යවන්න ඕනේ) + 🔔 + 🎧 support chat එකට පණිවිඩය
//   inform → ඉල්ලීම pending විදිහටම තියනවා, ගැටලුව ගැන 🔔 + 🎧 support chat එකට පණිවිඩය (උදා: phone අංකය එකතු කරන්න)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";
const BUCKET = "verification-docs";

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("verification_requests")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(50);
  const list = rows ?? [];
  const ids = [...new Set(list.map((r) => r.user_id))];
  const { data: profiles } = ids.length ? await admin.from("profiles").select("id, full_name, email, age, gender, city, country").in("id", ids) : { data: [] };
  // 👇 හැම user කෙනෙකුගෙම තහවුරු කිරීමේ checklist එක (email / phone / photo)
  const [{ data: privs }, { data: photos }, authUsers] = await Promise.all([
    ids.length ? admin.from("profile_private").select("user_id, phone").in("user_id", ids) : Promise.resolve({ data: [] as { user_id: string; phone: string | null }[] }),
    ids.length ? admin.from("profiles").select("id, avatar_url").in("id", ids) : Promise.resolve({ data: [] as { id: string; avatar_url: string | null }[] }),
    Promise.all(ids.map((id) => admin.auth.admin.getUserById(id).then((r) => r.data.user).catch(() => null))),
  ]);
  const checklist = (uid: string) => ({
    email: !!authUsers.find((u) => u?.id === uid)?.email_confirmed_at,
    phone: !!privs?.find((p) => p.user_id === uid)?.phone,
    photo: !!photos?.find((p) => p.id === uid)?.avatar_url,
  });
  const paths = list.flatMap((r) => [r.front_path, r.back_path, r.selfie_path].filter(Boolean)) as string[];
  const { data: signed } = paths.length ? await admin.storage.from(BUCKET).createSignedUrls(paths, 600) : { data: [] };
  const url = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return NextResponse.json({
    requests: list.map((r) => ({
      ...r,
      profile: profiles?.find((p) => p.id === r.user_id) ?? null,
      checklist: checklist(r.user_id),
      front_url: url.get(r.front_path) ?? null,
      back_url: r.back_path ? url.get(r.back_path) ?? null : null,
      selfie_url: url.get(r.selfie_path) ?? null,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "");
  const requestId = body?.requestId ? String(body.requestId) : null;
  const action = String(body?.action ?? "");
  const note = body?.note ? String(body.note).trim().slice(0, 1500) : null;
  // 🎧 Support chat එකට යන පණිවිඩය (prefix එකත් එක්ක) — නැත්නම් යවන්නේ නෑ
  const chatNote = body?.chatNote ? String(body.chatNote).trim().slice(0, 2000) : null;
  if (!userId || !["approve", "reject", "unverify", "inform"].includes(action)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (action === "inform" && !note) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (requestId) {
    const { error } = action === "inform"
      ? await admin.from("verification_requests").update({ admin_note: note }).eq("id", requestId) // 👈 status එක වෙනස් කරන්නේ නෑ
      : await admin.from("verification_requests").update({ status: action === "approve" ? "approved" : "rejected", admin_note: action === "approve" ? null : note, reviewed_at: now }).eq("id", requestId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (action === "approve") await admin.from("profiles").update({ id_verified: "Yes", verified_at: now }).eq("id", userId);
  // 🔔 User ට දැනුම් දෙනවා
  if (action === "approve") {
    // 👇 Verify වුණාම කලින් යවපු "මේක හදන්න" / "අනුමත වුණේ නෑ" පණිවිඩ තවදුරටත් ඕන නෑ — අයින් කරනවා
    await admin.from("notifications").delete().eq("user_id", userId).in("type", ["verify_rejected", "verify_info"]);
    await admin.from("verification_requests").update({ admin_note: null }).eq("user_id", userId).eq("status", "approved");
    await admin.from("notifications").insert({ user_id: userId, type: "verified", title: "verified", link: "/verify" });
    // 🎁 තෑග්ග: පළමු verified 500ට Founding Member + Premium මාස 3, ඊට පස්සේ හැමෝටම මාස 1
    //    (DB function එක — එක user කෙනෙකුට එක පාරයි, ගණන් කිරීම lock එකකින් ආරක්ෂිතයි. SQL එක run කරලා නැත්නම් නිකන් ඉස්සරහට යනවා)
    const { data: reward } = await admin.rpc("grant_verification_rewards", { p_user: userId });
    if (reward?.granted) {
      const founding = reward.reason === "founding";
      await admin.from("notifications").insert({
        user_id: userId,
        type: founding ? "founding_member" : "verify_reward",
        title: founding ? "founding_member" : "verify_reward",
        body: String(founding ? reward.number : reward.months),
        link: "/pricing",
      });
    }
    // 🎁 Refer a friend — මේ user refer වෙලා ආවා නම් එයාට, refer කරපු කෙනාට (ඒ කෙනත් verify නම්) මාසය බැගින්
    const { data: refer } = await admin.rpc("grant_referral_rewards", { p_user: userId });
    for (const uid of (refer?.rewarded ?? []) as string[]) {
      await admin.from("notifications").insert({ user_id: uid, type: "referral_reward", title: "referral_reward", body: String(refer?.months ?? 1), link: "/invite" });
    }
  } else if (action === "reject" || action === "inform") {
    const type = action === "reject" ? "verify_rejected" : "verify_info";
    const { error } = await admin.from("notifications").insert({ user_id: userId, type, title: type, body: note, link: "/verify" });
    if (error) return NextResponse.json({ error: `Notification failed: ${error.message}` }, { status: 500 });
    // 🎧 Support chat එකටත් — user ට ඒ ගමන්ම toast + chime එක එනවා, ඕන නම් එතනින්ම reply කරන්න පුළුවන්
    if (chatNote) await admin.from("support_messages").insert({ user_id: userId, sender: "admin", content: chatNote, read_by_admin: true });
  }
  if (action === "unverify") await admin.from("profiles").update({ id_verified: "No", verified_at: null }).eq("id", userId);
  return NextResponse.json({ ok: true });
}
