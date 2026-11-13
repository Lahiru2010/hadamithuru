// app/api/admin/stats/route.ts — 🛡️ ADMIN ONLY: Dashboard එකේ statistics + graphs වලට data
// GET ?days=30  (7 / 30 / 90)
// දින අනුව ගණන් කරන්නේ ශ්‍රී ලංකා වෙලාවෙන් (Asia/Colombo).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/admin";
import { getAdminId } from "@/lib/admin-auth";

export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;
const TZ = "Asia/Colombo";
const dayKey = (iso: string | Date) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }); // "2026-11-14"

// 👇 Supabase එක request එකකට rows 1000යි දෙන්නේ — ඒ නිසා කෑලි කෑලි ගන්නවා (ආරක්ෂාවට උපරිම 50,000)
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

type InterestRow = { status: string; created_at: string; accepted_at?: string | null };

// 👇 interests table එකේ වෙලාව තියෙන columns — පරණ database වල created_at / accepted_at නැති වෙන්න පුළුවන්
async function loadInterests(admin: Admin, since: string, warnings: string[]): Promise<InterestRow[]> {
  try {
    return await fetchAll<InterestRow>((a, b) => admin.from("interests").select("status, created_at, accepted_at").gte("created_at", since).range(a, b));
  } catch {
    try {
      return await fetchAll<InterestRow>((a, b) => admin.from("interests").select("status, created_at").gte("created_at", since).range(a, b));
    } catch (e) {
      warnings.push(`interests: ${e instanceof Error ? e.message : "failed"} — run the 20261117_interests_timestamps.sql file`);
      return [];
    }
  }
}

const count = async (admin: Admin, table: string, apply?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: c } = await q;
  return c ?? 0;
};

export async function GET(req: Request) {
  if (!(await getAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(raw) ? raw : 30;
  const admin = createAdminClient();
  const now = Date.now();
  const since = new Date(now - days * 86400_000).toISOString();
  const prevSince = new Date(now - 2 * days * 86400_000).toISOString();

  const warnings: string[] = []; // 👈 කොටසක් load කරන්න බැරි වුණත් dashboard එක පෙන්නනවා (මොකද වුණේ කියලා යටින්)
  try {
    type P = { id: string; gender: string | null; age: number | null; district: string | null; created_at: string; is_published: boolean | null; id_verified: string | null; last_seen_at: string | null; last_login_at: string | null };
    const [profiles, interests, messages, pendingVerifications, openReports, unreadSupport, totalMessages] = await Promise.all([
      fetchAll<P>((a, b) => admin.from("profiles").select("id, gender, age, district, created_at, is_published, id_verified, last_seen_at, last_login_at").range(a, b)),
      loadInterests(admin, prevSince, warnings),
      fetchAll<{ created_at: string }>((a, b) => admin.from("messages").select("created_at").gte("created_at", since).range(a, b)).catch((e) => { warnings.push(`messages: ${e.message}`); return [] as { created_at: string }[]; }),
      count(admin, "verification_requests", (q) => q.eq("status", "pending")),
      count(admin, "reports", (q) => q.eq("status", "open")),
      count(admin, "support_messages", (q) => q.eq("sender", "user").eq("read_by_admin", false)),
      count(admin, "messages"),
    ]);
    const [interestTotal, interestAccepted, interestPending, interestRejected] = await Promise.all([
      count(admin, "interests"),
      count(admin, "interests", (q) => q.eq("status", "accepted")),
      count(admin, "interests", (q) => q.eq("status", "pending")),
      count(admin, "interests", (q) => q.eq("status", "rejected")),
    ]);

    // 👇 දින list එක (පරණ → අලුත්)
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) labels.push(dayKey(new Date(now - i * 86400_000)));
    const series = (rows: { created_at: string }[]) => {
      const m = new Map(labels.map((l) => [l, 0]));
      for (const r of rows) {
        const k = dayKey(r.created_at);
        if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
      }
      return labels.map((l) => m.get(l) ?? 0);
    };

    const inRange = (iso: string, from: string, to?: string) => iso >= from && (!to || iso < to);
    const newUsers = profiles.filter((p) => inRange(p.created_at, since)).length;
    const newUsersPrev = profiles.filter((p) => inRange(p.created_at, prevSince, since)).length;
    const interestsNow = interests.filter((i) => i.created_at && inRange(i.created_at, since));
    const interestsPrev = interests.filter((i) => i.created_at && inRange(i.created_at, prevSince, since)).length;

    // 👇 සක්‍රිය users (site එකේ අන්තිමට හිටපු / login වුණ වෙලාව)
    const lastActive = (p: P) => [p.last_seen_at, p.last_login_at].filter(Boolean).sort().pop() ?? null;
    const activeWithin = (ms: number) => profiles.filter((p) => { const a = lastActive(p); return a && now - new Date(a).getTime() < ms; }).length;

    // 👇 ස්ත්‍රී / පුරුෂ
    const g = (v: string | null) => (v ?? "").toLowerCase();
    const gender = [
      { label: "Female", value: profiles.filter((p) => g(p.gender) === "female").length },
      { label: "Male", value: profiles.filter((p) => g(p.gender) === "male").length },
      { label: "Not set", value: profiles.filter((p) => !["female", "male"].includes(g(p.gender))).length },
    ];

    // 👇 වයස් කාණ්ඩ
    const ageBands: [string, number, number][] = [["18–24", 18, 24], ["25–29", 25, 29], ["30–34", 30, 34], ["35–39", 35, 39], ["40–49", 40, 49], ["50+", 50, 200]];
    const ages = ageBands.map(([label, lo, hi]) => ({ label, value: profiles.filter((p) => (p.age ?? 0) >= lo && (p.age ?? 0) <= hi).length }));

    // 👇 දිස්ත්‍රික්ක (ඉහළම 8)
    const dist = new Map<string, number>();
    for (const p of profiles) if (p.district) dist.set(p.district, (dist.get(p.district) ?? 0) + 1);
    const districts = [...dist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));

    const verified = profiles.filter((p) => p.id_verified === "Yes").length;
    const published = profiles.filter((p) => p.is_published).length;

    return NextResponse.json({
      days,
      labels,
      totals: {
        users: profiles.length,
        published,
        verified,
        newUsers,
        newUsersPrev,
        active24h: activeWithin(86400_000),
        active7d: activeWithin(7 * 86400_000),
        interests: interestTotal,
        interestsInRange: interestsNow.length,
        interestsPrev,
        matches: interestAccepted,
        messages: totalMessages,
        messagesInRange: messages.length,
        pendingVerifications,
        openReports,
        unreadSupport,
      },
      series: {
        signups: series(profiles),
        interests: series(interestsNow),
        // 👇 Match වුණ දවස (accepted_at) — column එක නැත්නම් ඇරයුම යැව්ව දවස අනුව
        matches: series(
          interests
            .filter((i) => i.status === "accepted" && (i.accepted_at ?? i.created_at) >= since)
            .map((i) => ({ created_at: (i.accepted_at ?? i.created_at) as string })),
        ),
        messages: series(messages),
      },
      breakdowns: {
        gender,
        ages,
        districts,
        verification: [
          { label: "Verified", value: verified },
          { label: "Pending", value: pendingVerifications },
          { label: "Not verified", value: Math.max(0, profiles.length - verified - pendingVerifications) },
        ],
        interestStatus: [
          { label: "Accepted", value: interestAccepted },
          { label: "Pending", value: interestPending },
          { label: "Declined", value: interestRejected },
        ],
      },
      generatedAt: new Date().toISOString(),
      warnings,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
