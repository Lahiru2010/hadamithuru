// app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import AuthCard, { authButtonClass, authInputClass } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const A = t.auth;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(A.errEmail);
    setLoading(true);
    setError("");
    await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    // Account එකක් තියෙනවද නැද්ද කියලා අනිත් අයට හොයාගන්න බැරි වෙන්න හැමවිටම එකම message එක
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard title={A.resetSentTitle}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="h-8 w-8" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{A.resetSentMsg.replace("{email}", email.trim())}</p>
          <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> {A.backToLogin}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={A.forgotTitle} subtitle={A.forgotSubtitle}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="email" autoComplete="email" autoFocus placeholder={A.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInputClass} pl-10`} />
        </div>
        {error && <p className="ml-1 text-xs font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {A.sending}</> : A.sendResetLink}
        </button>
      </form>
      <Link href="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {A.backToLogin}
      </Link>
    </AuthCard>
  );
}
