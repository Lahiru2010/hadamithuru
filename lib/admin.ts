// lib/admin.ts
// Service Role client එක — RLS bypass කරනවා. මේක SERVER එකේ විතරයි import කරන්න ඕන
// (API routes / server components). Client component එකකට කවදාවත් import කරන්න එපා.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const AVATAR_BUCKET = "avatars";
