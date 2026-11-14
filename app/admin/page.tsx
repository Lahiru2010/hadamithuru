"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Trash2, User, ShieldAlert, ChevronLeft, ChevronRight, Calendar, Mail, Users as Users2, BadgeCheck, Headset, Flag, Crown, Search, X as XIcon, LayoutDashboard, Heart, Zap } from "lucide-react";
import AvatarImage from "@/components/AvatarImage";
import { isAdminEmail } from "@/lib/admin-emails";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/DialogProvider";
import AdminVerification from "@/components/admin/AdminVerification";
import AdminSupport from "@/components/admin/AdminSupport";
import AdminContact from "@/components/admin/AdminContact";
import AdminReports from "@/components/admin/AdminReports";
import AdminAdmins from "@/components/admin/AdminAdmins";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminStories from "@/components/admin/AdminStories";
import AdminPricing from "@/components/admin/AdminPricing";



export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showConfirm, showAlert } = useDialog();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  // 👇 ?tab=verify / support / reports (notification එක click කළාම ඒ tab එකම open වෙන්න)
  const [role, setRole] = useState<"super_admin" | "admin" | null>(null);
  const isSuper = role === "super_admin";
  // 👇 Users tab: සෙවීම + පිළිවෙළ
  const [userQuery, setUserQuery] = useState("");
  const [userSort, setUserSort] = useState<"newest" | "oldest" | "name" | "verified">("newest");
  // 👇 Default tab එක දැන් "Overview" (statistics + graphs)
  const [tab, setTab] = useState<"overview" | "users" | "verify" | "support" | "contact" | "reports" | "stories" | "pricing" | "admins">(() => {
    if (typeof window === "undefined") return "overview";
    // වෙන page එකක notification එකකින් ආවොත් (sessionStorage) හෝ ?tab=...
    const stored = sessionStorage.getItem("seneha_admin_tab");
    sessionStorage.removeItem("seneha_admin_tab");
    const q = stored ?? new URLSearchParams(window.location.search).get("tab");
    return q === "users" || q === "verify" || q === "support" || q === "contact" || q === "reports" || q === "stories" || q === "pricing" || q === "admins" ? q : "overview";
  });
  const [summary, setSummary] = useState<{ pendingVerifications: number; unreadSupport: number; openReports: number; pendingBoosts?: number; pendingStories?: number; newContact?: number }>({ pendingVerifications: 0, unreadSupport: 0, openReports: 0, pendingBoosts: 0 });
  // Admin page එකේ ඉන්නකොට notification එකක් click කළොත් ඒ tab එකට මාරු වෙන්න
  useEffect(() => {
    const onTab = (e: Event) => setTab((e as CustomEvent).detail);
    window.addEventListener("admin-tab", onTab);
    return () => window.removeEventListener("admin-tab", onTab);
  }, []);

  // 👇 අලුත් verification requests / support messages ගණන (තත්පර 30කට සැරයක්)
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => fetch("/api/admin/summary", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => d && setSummary(d));
    load();
    const id = setInterval(load, 30000);
    window.addEventListener("admin-data-changed", load); // ⚡ Realtime
    return () => { clearInterval(id); window.removeEventListener("admin-data-changed", load); };
  }, [isAdmin, tab]);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      // 👇 Role එක server එකෙන් (super_admin / admin)
      const me = await fetch("/api/admin/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (!me?.role) { router.push("/"); return; }
      setRole(me.role);
      setIsAdmin(true);
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    checkAdminAndFetch();
  }, [router]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = await showConfirm({
      title: `Delete ${userName || "this user"}?`,
      message: "This user's account will be permanently deleted. This can't be undone.",
      confirmText: "Delete user",
      tone: "danger",
    });
    if (confirmDelete) {
      const res = await fetch("/api/admin/users/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const error = res.ok ? null : { message: (await res.json().catch(() => null))?.error ?? "Failed" };
      if (error) showAlert({ title: "Couldn't delete user", message: error.message, tone: "error" });
      else {
        showAlert({ title: "User deleted", message: `${userName || "The user"} has been deleted successfully.`, tone: "success" });
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers);
        if (Math.ceil(updatedUsers.length / itemsPerPage) < currentPage && currentPage > 1) setCurrentPage(currentPage - 1);
      }
    }
  };

  if (!isAdmin && !loading) return null;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const term = userQuery.trim().toLowerCase();
  const shownUsers = users
    .filter((u) => !term || (u.full_name ?? "").toLowerCase().includes(term) || (u.email ?? "").toLowerCase().includes(term))
    .sort((a, b) =>
      userSort === "name" ? (a.full_name ?? "").localeCompare(b.full_name ?? "")
      : userSort === "oldest" ? (a.created_at ?? "").localeCompare(b.created_at ?? "")
      : userSort === "verified" ? (b.id_verified === "Yes" ? 1 : 0) - (a.id_verified === "Yes" ? 1 : 0) || (b.created_at ?? "").localeCompare(a.created_at ?? "")
      : (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const currentUsers = shownUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(shownUsers.length / itemsPerPage));

  const NAV = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard, count: 0 },
    { id: "users" as const, label: "Users", icon: Users2, count: 0 },
    { id: "verify" as const, label: "Verification", icon: BadgeCheck, count: summary.pendingVerifications },
    { id: "support" as const, label: "Customer support", icon: Headset, count: summary.unreadSupport },
    { id: "contact" as const, label: "Contact form", icon: Mail, count: summary.newContact ?? 0 }, // 📮 update-59
    { id: "reports" as const, label: "Reports", icon: Flag, count: summary.openReports },
    { id: "stories" as const, label: "Success stories", icon: Heart, count: summary.pendingStories ?? 0 },
    { id: "pricing" as const, label: "Pricing & boost", icon: Zap, count: summary.pendingBoosts ?? 0 },
    ...(isSuper ? [{ id: "admins" as const, label: "Admins", icon: Crown, count: 0 }] : []),
  ];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 py-8 relative z-10">
        {/* 👇 Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D52047] to-[#AD032A] text-white shadow-lg shadow-primary/25"><ShieldAlert className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {users.length} members</p>
            </div>
          </div>
          {role && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isSuper ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"}`}>
              {isSuper ? <Crown className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />} {isSuper ? "Super admin" : "Admin"}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* 👇 Sidebar (phone එකේ උඩින් තිරස්ව scroll වෙනවා) */}
          {!loading && isAdmin && (
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <nav className="flex gap-1.5 overflow-x-auto rounded-3xl border border-border bg-background p-2 shadow-sm custom-scrollbar lg:flex-col lg:overflow-visible">
                {NAV.map(({ id, label, icon: Icon, count }) => (
                  <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${tab === id ? "bg-gradient-to-r from-[#D52047] to-[#AD032A] text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 whitespace-nowrap">{label}</span>
                    {count > 0 && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tab === id ? "bg-white/25" : "bg-red-500 text-white"}`}>{count}</span>}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          <div className="min-w-0">
        {!loading && isAdmin && tab === "overview" && <AdminOverview onOpenTab={setTab} />}
        {!loading && isAdmin && tab === "verify" && <AdminVerification />}
        {!loading && isAdmin && tab === "support" && <AdminSupport />}
        {!loading && isAdmin && tab === "contact" && <AdminContact />}
        {!loading && isAdmin && tab === "reports" && <AdminReports />}
        {!loading && isAdmin && tab === "stories" && <AdminStories />}
        {!loading && isAdmin && tab === "pricing" && <AdminPricing />}
        {!loading && isSuper && tab === "admins" && <AdminAdmins />}

        {/* 👇 Users: සෙවීම + පිළිවෙළ (join වුණ දිනය / නම / verified) */}
        {tab === "users" && !loading && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[16rem] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={userQuery} onChange={(e) => { setUserQuery(e.target.value); setCurrentPage(1); }} placeholder="Search name or email…" className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary" />
              {userQuery && (
                <button onClick={() => { setUserQuery(""); setCurrentPage(1); }} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"><XIcon className="h-4 w-4" /></button>
              )}
            </div>
            <select value={userSort} onChange={(e) => { setUserSort(e.target.value as typeof userSort); setCurrentPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
              <option value="newest">Joined: newest first</option>
              <option value="oldest">Joined: oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="verified">Verified first</option>
            </select>
            <span className="text-sm text-muted-foreground">{shownUsers.length} users</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-primary font-medium animate-pulse lg:col-span-2">Checking permissions...</div>
        ) : tab !== "users" ? null : (
          <div className="bg-background rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-4 font-semibold text-muted-foreground">User Details</th>
                    <th className="p-4 font-semibold text-muted-foreground">Joined Date</th>
                    <th className="p-4 font-semibold text-muted-foreground">Age</th>
                    <th className="p-4 font-semibold text-muted-foreground">Gender</th>
                    <th className="p-4 font-semibold text-muted-foreground">Country</th>
                    <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <AvatarImage src={user.avatar_url ? `/api/avatar/${user.id}?admin=1` : undefined} alt={user.full_name} className="w-10 h-10" />
                          <div>
                            <p className="font-semibold text-foreground">{user.full_name || "Unknown"}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><Mail className="h-3 w-3" /><span>{user.email || "No Email"}</span></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-4 w-4" /><span>{user.created_at ? new Date(user.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}</span></div>
                      </td>
                      <td className="p-4 text-sm">{user.age || "-"}</td>
                      <td className="p-4 text-sm capitalize">{user.gender || "-"}</td>
                      <td className="p-4 text-sm">{user.country || "-"}</td>
                      <td className="p-4 text-right">
                        {/* 👑 Users මකන්න පුළුවන් super admin ට විතරයි */}
                        {isSuper ? (
                          <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors dark:bg-red-500/10"><Trash2 className="h-4 w-4" /> Delete</button>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {currentUsers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>}
                </tbody>
              </table>
            </div>

            {users.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-background">
                <p className="text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> to <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, users.length)}</span> of <span className="font-semibold text-foreground">{users.length}</span> users</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronLeft className="h-5 w-5" /></button>
                  <span className="text-sm font-medium px-4">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </main>
  );
}