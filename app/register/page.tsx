// app/register/page.tsx
// Register වෙන පියවර: 1) ගිණුම (Google / Facebook / email) → 2) Phone OTP → 3) Profile wizard
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";
import AuthCard, { authButtonClass, authInputClass } from "@/components/AuthCard";
import SocialLoginButtons, { OrDivider } from "@/components/SocialLoginButtons";
import { DEFAULT_PHONE_COUNTRY, formatPhone, normalizePhone } from "@/lib/phone";
import PhoneInput from "@/components/PhoneInput";
import { PHONE_OTP_LIVE, sendPhoneOtp, verifyPhoneOtp } from "@/lib/phone-otp";
import { rememberDevLogin } from "@/components/DevQuickLogin"; // 🧪 DEV ONLY

type Stage = "form" | "otp" | "check-email";
const RESEND_SECONDS = 30;

// useSearchParams() එකට Suspense එකක් ඕන (Next.js නීතියක්)
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const { t } = useLang();
  const A = t.auth;
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  // 👇 Home page එකේ "පටන් ගන්න" එකෙන් email එක ආවොත් (?email=...) ඒක auto පුරවනවා
  const searchParams = useSearchParams();
  const emailFromLink = searchParams.get("email") ?? "";
  const [prefilled, setPrefilled] = useState(false);
  if (emailFromLink && !prefilled) {
    setPrefilled(true);
    setEmail(emailFromLink);
  }
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState(""); // +947XXXXXXXX
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false); // 👈 නියමයන්ට එකඟද
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- 1) Account form ----------
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = A.errEmail;
    const normalized = normalizePhone(phoneCountry, phoneInput);
    if (!normalized) errs.phone = phoneCountry === "LK" ? A.errPhone : A.errPhoneGeneric;
    if (password.length < 8) errs.password = A.errPassword;
    else if (password !== confirm) errs.confirm = A.errMatch;
    if (!agree) errs.terms = t.extra.agreeRequired;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setFormError("");
    const res = await sendPhoneOtp(normalized!);
    setLoading(false);
    if (!res.ok) return setFormError(res.error ?? "Couldn't send the code.");
    setPhone(normalized!);
    setStage("otp");
  };

  // ---------- 2) OTP → account හදනවා ----------
  const createAccount = async (code: string) => {
    setLoading(true);
    setFormError("");
    const check = await verifyPhoneOtp(phone, code);
    if (!check.ok) {
      setLoading(false);
      return setFormError(check.error ?? A.otpError);
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { phone, terms_accepted_at: new Date().toISOString() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });

    if (error) {
      setLoading(false);
      setFormError(error.message);
      setStage("form");
      return;
    }

    rememberDevLogin(email.trim(), password); // 🧪 DEV ONLY — අලුත් account එක quick login list එකට

    // Email confirm කරන්න ඕන නැති setup එකක් නම් කෙලින්ම login වෙලා — profile row එක හදලා wizard එකට
    if (data.session && data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, email: email.trim(), terms_accepted_at: new Date().toISOString() });
      // 🔒 Phone number එක private table එකට (අනිත් අයට පේන්නේ නෑ)
      await supabase.from("profile_private").upsert({ user_id: data.user.id, phone }, { onConflict: "user_id" });
      router.push("/profile");
      router.refresh();
      return;
    }

    // Email confirm කරන්න ඕන නම්
    setLoading(false);
    setStage("check-email");
  };

  // ---------- UI ----------
  if (stage === "check-email") {
    return (
      <AuthCard title={A.checkEmailTitle}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{A.checkEmailMsg.replace("{email}", email.trim())}</p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">{A.backToLogin}</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={stage === "otp" ? A.otpTitle : A.registerTitle}
      subtitle={stage === "otp" ? A.otpSubtitle.replace("{phone}", formatPhone(phone)) : A.registerSubtitle}
    >
      <StepDots current={stage === "form" ? 0 : 1} labels={[A.step1, A.step2, A.step3]} />

      {stage === "form" ? (
        <>
          <form onSubmit={submitForm} className="space-y-4" noValidate>
            <FormField label={A.email} error={errors.email} icon={<Mail className="h-4 w-4" />}>
              <input type="email" autoComplete="email" placeholder={A.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className={`${authInputClass} pl-10`} />
            </FormField>

            {/* 👇 රටේ කොඩිය + code එක (default 🇱🇰 +94) */}
            <div>
              <label className="ml-1 text-sm font-semibold">
                {A.phone} <span className="text-xs font-normal text-muted-foreground">· {A.phoneHint}</span>
              </label>
              <div className="mt-2">
                <PhoneInput
                  country={phoneCountry}
                  number={phoneInput}
                  invalid={!!errors.phone}
                  onChange={(c, n) => { setPhoneCountry(c); setPhoneInput(n); }}
                />
              </div>
              {errors.phone && <p className="ml-1 mt-1.5 text-xs font-medium text-red-500">{errors.phone}</p>}
            </div>

            <FormField label={A.password} hint={A.passwordHint} error={errors.password} icon={<Lock className="h-4 w-4" />}>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${authInputClass} pl-10 pr-12`} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? A.hide : A.show} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </FormField>

            <FormField label={A.confirmPassword} error={errors.confirm} icon={<Lock className="h-4 w-4" />}>
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${authInputClass} pl-10`} />
            </FormField>

            {/* 👇 භාවිත නියමයන් + පෞද්ගලිකත්ව ප්‍රතිපත්තියට එකඟතාවය (අනිවාර්යයි) */}
            <div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm leading-relaxed">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#D61F55]" />
                <span>
                  {t.extra.agreeTerms.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
                    part === "{terms}" ? <Link key={i} href="/terms" target="_blank" className="font-semibold text-primary hover:underline">{t.extra.termsLink}</Link>
                    : part === "{privacy}" ? <Link key={i} href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">{t.extra.privacyLink}</Link>
                    : <span key={i}>{part}</span>
                  )}
                </span>
              </label>
              {errors.terms && <p className="ml-1 mt-1.5 text-xs font-medium text-red-500">{errors.terms}</p>}
            </div>

            {formError && <p className="rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-500">{formError}</p>}

            <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : A.continueBtn}
            </button>
          </form>

          {/* 👇 Google / Facebook — ප්‍රධාන form එකට යටින් */}
          <OrDivider label={A.orContinueWith} />
          <SocialLoginButtons next="/profile" />
          <p className="mt-3 text-center text-xs text-muted-foreground">{t.extra.agreeSocial}</p>

          {/* 👇 Profile එක publish කරනකම් private කියලා user ට විශ්වාසය දෙනවා */}
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {A.privateNote}
          </p>

          <p className="mt-6 text-center text-base text-muted-foreground">
            {A.haveAccount} <Link href="/login" className="font-semibold text-primary hover:underline">{A.loginLink}</Link>
          </p>
        </>
      ) : (
        <OtpStep
          loading={loading}
          error={formError}
          onVerify={createAccount}
          onResend={() => sendPhoneOtp(phone)}
          onChangeNumber={() => { setStage("form"); setFormError(""); }}
          labels={A}
        />
      )}
    </AuthCard>
  );
}

// ---------- Helpers ----------

function StepDots({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="mb-6 flex items-center justify-center gap-2">
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
            i < current ? "bg-green-500/15 text-green-600 dark:text-green-400" : i === current ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          }`}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`text-xs font-semibold ${i === current ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
          {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function FormField({ label, hint, error, icon, children }: { label: string; hint?: string; error?: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="ml-1 text-sm font-semibold">
        {label} {hint && <span className="text-xs font-normal text-muted-foreground">· {hint}</span>}
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
      {error && <p className="ml-1 mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function OtpStep({
  loading, error, onVerify, onResend, onChangeNumber, labels: A,
}: {
  loading: boolean;
  error: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
  labels: ReturnType<typeof useLang>["t"]["auth"];
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [localError, setLocalError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const setDigit = (i: number, value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length > 1) {
      // Paste කළොත් (උදා: "123456") boxes ඔක්කොම පුරවනවා
      const next = [...digits];
      v.slice(0, 6 - i).split("").forEach((d, k) => { next[i + k] = d; });
      setDigits(next);
      inputs.current[Math.min(i + v.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return setLocalError(A.otpError);
    setLocalError("");
    onVerify(code);
  };

  return (
    <form onSubmit={submit}>
      {!PHONE_OTP_LIVE && (
        <p className="mb-5 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
          🧪 {A.otpTestMode}
        </p>
      )}

      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus(); }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-border bg-background/50 text-center text-xl font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        ))}
      </div>

      {(localError || error) && <p className="mt-4 text-center text-sm font-medium text-red-500">{localError || error}</p>}

      <button type="submit" disabled={loading} className={`${authButtonClass} mt-6`}>
        {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> {A.creating}</> : A.otpVerify}
      </button>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button type="button" onClick={onChangeNumber} className="font-medium text-muted-foreground hover:text-foreground">{A.otpChange}</button>
        {seconds > 0 ? (
          <span className="text-muted-foreground">{A.otpResendIn.replace("{s}", String(seconds))}</span>
        ) : (
          <button type="button" onClick={() => { onResend(); setSeconds(RESEND_SECONDS); }} className="font-semibold text-primary hover:underline">{A.otpResend}</button>
        )}
      </div>
    </form>
  );
}
