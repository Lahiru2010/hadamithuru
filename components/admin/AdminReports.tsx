// components/admin/AdminReports.tsx — 🛡️ Admin: වාර්තා (Open → Under review → Resolved)
"use client";

import { useEffect, useState } from "react";
import { Eye, Flag, Loader2 } from "lucide-react";
import { ProfileModal } from "@/components/ProfileModal";
import { createClient } from "@/lib/client";

type Report = {
  id: string; reason: string; details: string | null; status: string; admin_note: string | null; created_at: string;
  reporter_id: string; reported_id: string; total_against: number;
  reporter: { full_name: string; email: string } | null; reported: { full_name: string; email: string } | null;
};
const REASON: Record<string, string> = { fake: "Fake profile", photos: "Inappropriate photos", harass: "Harassment", scam: "Money / scam", married: "Already married", other: "Other" };

export default function AdminReports() {
  const [status, setStatus] = useState<"open" | "reviewing" | "resolved">("open");
  const [list, setList] = useState<Report[] | null>(null);
  const [viewing, setViewing] = useState<Record<string, unknown> | null>(null);

  const load = (st = status) => { setList(null); fetch(`/api/admin/reports?status=${st}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setList(d.reports ?? [])); };
  useEffect(() => {
    load(status);
    const onChange = () => load(status); // ⚡ Realtime
    window.addEventListener("admin-data-changed", onChange);
    return () => window.removeEventListener("admin-data-changed", onChange);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const setReportStatus = async (id: string, next: string) => {
    const note = next === "resolved" ? window.prompt("Internal note (what action was taken?)", "") : null;
    if (next === "resolved" && note === null) return;
    await fetch("/api/admin/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next, note }) });
    load();
  };
  const view = async (id: string) => {
    const { data } = await createClient().from("profiles").select("*").eq("id", id).maybeSingle();
    if (data) setViewing({ ...data, avatar_url: `/api/avatar/${id}?admin=1`, isBlurred: false, interestStatus: "accepted" });
  };

  return (
    <section className="mb-10 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Flag className="h-6 w-6 text-red-500" /> Reports</h2>
        <div className="flex rounded-xl border border-border p-1">
          {(["open", "reviewing", "resolved"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-primary text-white" : "text-muted-foreground"}`}>{s === "reviewing" ? "Under review" : s}</button>
          ))}
        </div>
      </div>
      {list === null ? <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted-foreground" /> :
        list.length === 0 ? <p className="mt-6 text-center text-muted-foreground">Nothing here 🎉</p> : (
        <div className="mt-6 space-y-4">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-600">{REASON[r.reason]}</span>{" "}
                    {r.reported?.full_name ?? "Unknown"} <span className="text-sm font-normal text-muted-foreground">· {r.reported?.email}</span>
                    {r.total_against > 1 && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600">{r.total_against} reports total</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Reported by {r.reporter?.full_name ?? "—"} ({r.reporter?.email}) · {new Date(r.created_at).toLocaleString()}</p>
                  {r.details && <p className="mt-2 rounded-xl bg-muted/50 p-3 text-sm">“{r.details}”</p>}
                  {r.admin_note && <p className="mt-2 text-xs text-muted-foreground">Note: {r.admin_note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => view(r.reported_id)} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"><Eye className="h-4 w-4" /> Profile</button>
                  {r.status === "open" && <button onClick={() => setReportStatus(r.id, "reviewing")} className="rounded-xl border border-amber-500/40 px-3 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-500/10">Start review</button>}
                  {r.status !== "resolved" && <button onClick={() => setReportStatus(r.id, "resolved")} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">Resolve</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {viewing && <ProfileModal profile={viewing} onClose={() => setViewing(null)} hideActions isPreview adminView />}
    </section>
  );
}
