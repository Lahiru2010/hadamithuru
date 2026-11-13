// app/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import AuthCard, { authButtonClass, authInputClass } from "@/components/AuthCard";
import SocialLoginButtons, { OrDivider } from "@/components/SocialLoginButtons";
import DevQuickLogin, { rememberDevLogin } from "@/components/DevQuickLogin"; // 🧪 DEV ONLY
import { setRememberMe } from "@/components/SessionGuard";
import { isAdminEmail } from "@/lib/admin-emails";

// useSearchParams() එකට Suspense එකක් ඕන (Next.js නීතියක්)
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { t } = useLang();
  const A = t.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true); // 👈 "මාව මතක තබාගන්න"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(searchParams.get("error") ? "Login failed. Please try again." : "");

  const login = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // 👇 "මාව මතක තබාගන්න" නැත්නම් browser එක වැහුවම logout වෙනවා (SessionGuard එක බලනවා)
    setRememberMe(remember);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
    rememberDevLogin(loginEmail, loginPassword, profile?.full_name); // 🧪 DEV ONLY — quick login list එකට
    // 👈 Admin නම් Admin dashboard එකට, අනිත් අය Browse page එකට
    const adminMe = await fetch("/api/admin/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    router.push(adminMe?.role || isAdminEmail(data.user.email) ? "/admin" : "/browse");
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <AuthCard title={A.loginTitle} subtitle={A.loginSubtitle}>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="ml-1 text-sm font-semibold">{A.email}</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" autoComplete="email" placeholder={A.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInputClass} pl-10`} required />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="ml-1 text-sm font-semibold">{A.password}</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">{A.forgot}</Link>
          </div>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${authInputClass} pl-10 pr-12`} required />
            <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? A.hide : A.show} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {/* 👇 මාව මතක තබාගන්න */}
        <label className="ml-1 flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-foreground">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-[#D61F55]" />
          {A.rememberMe}
        </label>

        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {A.loggingIn}</> : A.login}
        </button>
      </form>

      {message && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">{message}</p>}

      {/* 👇 Google / Facebook — ප්‍රධාන login form එකට යටින් */}
      <OrDivider label={A.orContinueWith} />
      <SocialLoginButtons next="/browse" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {A.noAccount} <Link href="/register" className="font-semibold text-primary hover:underline">{A.registerLink}</Link>
      </p>

      <DevQuickLogin disabled={loading} onSelect={(em, pw) => { setEmail(em); setPassword(pw); login(em, pw); }} /> {/* 🧪 DEV ONLY */}
    </AuthCard>
  );
}
