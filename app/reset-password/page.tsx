// app/reset-password/page.tsx
// Email එකේ ආපු "reset password" link එක click කළාම මෙතනට එනවා (auth/callback හරහා, login වෙලා)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import { useDialog } from "@/components/DialogProvider";
import AuthCard, { authButtonClass, authInputClass } from "@/components/AuthCard";

export default function ResetPasswordPage() {
  const { t } = useLang();
  const A = t.auth;
  const router = useRouter();
  const { showAlert } = useDialog();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(A.errPassword);
    if (password !== confirm) return setError(A.errMatch);
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    await showAlert({ title: A.passwordUpdated, tone: "success" });
    router.push("/");
    router.refresh();
  };

  return (
    <AuthCard title={A.resetTitle} subtitle={A.resetSubtitle}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="ml-1 text-sm font-semibold">{A.newPassword} <span className="text-xs font-normal text-muted-foreground">· {A.passwordHint}</span></label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={`${authInputClass} pl-10 pr-12`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? A.hide : A.show} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="ml-1 text-sm font-semibold">{A.confirmPassword}</label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${authInputClass} pl-10`} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {A.updating}</> : A.updatePassword}
        </button>
      </form>
    </AuthCard>
  );
}
