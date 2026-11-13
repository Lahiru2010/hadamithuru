// components/SocialLoginButtons.tsx
// Google / Facebook එකෙන් login / register වෙන්න.
// ⚠️ Supabase dashboard → Authentication → Providers එකේ Google සහ Facebook enable කරලා තියෙන්න ඕන.
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/client";
import { useLang } from "@/components/providers";

type Provider = "google" | "facebook";

export default function SocialLoginButtons({ next = "/" }: { next?: string }) {
  const { t } = useLang();
  const A = t.auth;
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: Provider) => {
    setLoading(provider);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // සාර්ථක නම් browser එක Google / Facebook එකට යනවා. Error එකක් ආවොත් විතරයි මෙතනට එන්නේ.
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

  const base =
    "w-full flex items-center justify-center gap-3 rounded-xl border py-3 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => signIn("google")} disabled={!!loading} className={`${base} border-border bg-white text-gray-800 hover:bg-gray-50`}>
        {loading === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
        {A.continueWithGoogle}
      </button>
      <button type="button" onClick={() => signIn("facebook")} disabled={!!loading} className={`${base} border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166FE5]`}>
        {loading === "facebook" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FacebookIcon />}
        {A.continueWithFacebook}
      </button>
      {error && <p className="text-center text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}
