// app/api/admin/reports/route.ts — 🛡️ ADMIN ONLY
// GET  ?status=open|reviewing|resolved → වාර්තා (දෙපැත්තේම නම් එක්ක, එකම කෙනා ගැන කීයක් ආවද)
// POST { id, status, note? } → තත්ත්වය වෙනස් කරනවා (resolved කළාම වාර්තා කළ කෙනාට දැනුම්දීමක්)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") ?? "open";
  const admin = createAdminClient();
  const { data: rows } = await admin.from("reports").select("*").eq("status", status).order("created_at", { ascending: true }).limit(100);
  const list = rows ?? [];
  const ids = [...new Set(list.flatMap((r) => [r.reporter_id, r.reported_id]))];
  const [{ data: profiles }, { data: allAgainst }] = await Promise.all([
    ids.length ? admin.from("profiles").select("id, full_name, email").in("id", ids) : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
    list.length ? admin.from("reports").select("reported_id").in("reported_id", list.map((r) => r.reported_id)) : Promise.resolve({ data: [] as { reported_id: string }[] }),
  ]);
  const totals = new Map<string, number>();
  for (const r of allAgainst ?? []) totals.set(r.reported_id, (totals.get(r.reported_id) ?? 0) + 1);
  const name = (id: string) => profiles?.find((p) => p.id === id) ?? null;
  return NextResponse.json({
    reports: list.map((r) => ({ ...r, reporter: name(r.reporter_id), reported: name(r.reported_id), total_against: totals.get(r.reported_id) ?? 1 })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  const status = String(body?.status ?? "");
  const note = body?.note ? String(body.note).slice(0, 500) : null;
  if (!id || !["open", "reviewing", "resolved"].includes(status)) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const admin = createAdminClient();
  const { data: r } = await admin.from("reports").update({ status, admin_note: note, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id).select("reporter_id, reported_id").single();
  if (r && status === "resolved") {
    const { data: p } = await admin.from("profiles").select("full_name").eq("id", r.reported_id).maybeSingle();
    await admin.from("notifications").insert({ user_id: r.reporter_id, type: "report_reviewed", title: "report_reviewed", body: p?.full_name ?? "", link: "/help" });
  }
  return NextResponse.json({ ok: true });
}
