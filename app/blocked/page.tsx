// app/blocked/page.tsx
// Block කළ අය — බලලා unblock කරන්න (navbar එකේ නම යට menu එකෙන් එන්න පුළුවන්)
"use client";

import { useEffect, useState } from "react";
import { Ban, Loader2, UserX } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import AvatarImage from "@/components/AvatarImage";
import { withFastAvatars } from "@/lib/avatar-client";

type Person = { id: string; full_name: string; avatar_url?: string | null; created_at?: string };

export default function BlockedPage() {
  const { t } = useLang();
  const H = t.help;
  const IT = t.interests;
  const { showConfirm, showAlert } = useDialog();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setPeople([]);
      const { data: rows } = await supabase.from("blocks").select("blocked_id, created_at").eq("blocker_id", user.id).order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r) => r.blocked_id);
      if (!ids.length) return setPeople([]);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      const list = ids.map((id) => profiles?.find((p) => p.id === id)).filter(Boolean) as Person[];
      setPeople(await withFastAvatars(list));
    })();
  }, []);

  const unblock = async (p: Person) => {
    const ok = await showConfirm({ title: IT.unblockTitle.replace("{name}", p.full_name), message: IT.unblockMsg, confirmText: IT.unblock });
    if (!ok) return;
    setBusy(p.id);
    const res = await fetch("/api/block", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: p.id }) });
    setBusy(null);
    if (!res.ok) return showAlert({ title: "Something went wrong", tone: "error" });
    setPeople((list) => (list ?? []).filter((x) => x.id !== p.id));
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-foreground"><Ban className="h-7 w-7 text-primary" /> {H.blockedUsers}</h1>
        <p className="mt-2 text-muted-foreground">{H.blockedHint}</p>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-background shadow-sm">
          {people === null ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : people.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
              <UserX className="h-10 w-10 opacity-50" /> {H.blockedEmpty}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {people.map((p) => (
                <li key={p.id} className="flex items-center gap-4 p-4">
                  <AvatarImage src={p.avatar_url ?? undefined} alt={p.full_name} className="h-12 w-12" />
                  <span className="flex-1 font-semibold">{p.full_name}</span>
                  <button onClick={() => unblock(p)} disabled={busy === p.id} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary/50 hover:text-primary disabled:opacity-60">
                    {busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />} {IT.unblock}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
