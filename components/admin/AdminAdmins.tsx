// components/admin/AdminAdmins.tsx — 👑 Super admin ට විතරයි: admins එකතු කරන්න / අයින් කරන්න
"use client";

import { useEffect, useState } from "react";
import { Crown, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

type Admin = { email: string; role: "super_admin" | "admin"; created_at: string };

export default function AdminAdmins() {
  const { showConfirm, showAlert } = useDialog();
  const [list, setList] = useState<Admin[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/admin/admins", { cache: "no-store" }).then((r) => r.json()).then((d) => setList(d.admins ?? []));
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: "admin" }) });
    setBusy(false);
    if (!res.ok) return showAlert({ title: (await res.json().catch(() => null))?.error ?? "Couldn't add admin", tone: "error" });
    setEmail("");
    load();
  };

  const remove = async (a: Admin) => {
    const ok = await showConfirm({ title: `Remove ${a.email} as admin?`, message: "They will lose access to the admin dashboard.", confirmText: "Remove", tone: "danger" });
    if (!ok) return;
    const res = await fetch("/api/admin/admins", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: a.email }) });
    if (!res.ok) return showAlert({ title: (await res.json().catch(() => null))?.error ?? "Couldn't remove admin", tone: "error" });
    load();
  };

  return (
    <section className="mb-10 rounded-[2rem] border border-border bg-background p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Crown className="h-6 w-6 text-amber-500" /> Admins</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        <b>Super admin</b> — full access. <b>Admin</b> — verification, customer support and reports, but <u>can&apos;t delete users</u> or manage admins.
      </p>

      <form onSubmit={add} className="mt-5 flex flex-wrap gap-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="New admin's email (they must have an account)" className="min-w-[16rem] flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm outline-none focus:border-primary" />
        <button disabled={busy || !email.trim()} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add admin
        </button>
      </form>

      {list === null ? <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-muted-foreground" /> : (
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {list.map((a) => (
            <li key={a.email} className="flex items-center gap-3 p-4">
              {a.role === "super_admin" ? <Crown className="h-5 w-5 text-amber-500" /> : <ShieldCheck className="h-5 w-5 text-blue-500" />}
              <span className="flex-1 font-medium">{a.email}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.role === "super_admin" ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>{a.role === "super_admin" ? "Super admin" : "Admin"}</span>
              {a.role !== "super_admin" && (
                <button onClick={() => remove(a)} aria-label="Remove admin" className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
