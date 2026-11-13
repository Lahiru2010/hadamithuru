// lib/phone-otp.ts
// Phone number එක OTP එකකින් තහවුරු කරන කොටස.
//
// ⚠️ දැනට "TEST MODE" එකේ තියෙන්නේ: SMS යවන්නේ නෑ, ඕනම ඉලක්කම් 6ක් බාරගන්නවා.
//    පස්සේ ඇත්ත SMS provider එකක් (Notify.lk, Dialog, Twilio Verify වගේ) සම්බන්ධ කරනකොට
//    මේ functions දෙක ඇතුළේ ඒ API එකට call කරන්න — register page එකේ වෙන කිසිම දෙයක් වෙනස් කරන්න ඕන නෑ.
//    ඒ වෙලාවට .env.local එකේ NEXT_PUBLIC_PHONE_OTP_LIVE=true දාන්න.

export const PHONE_OTP_LIVE = process.env.NEXT_PUBLIC_PHONE_OTP_LIVE === "true";

export async function sendPhoneOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (!PHONE_OTP_LIVE) return { ok: true }; // TEST MODE
  // TODO: SMS provider එකට request එක මෙතනින් (උදා: fetch("/api/otp/send", { method: "POST", body: JSON.stringify({ phone }) }))
  void phone;
  return { ok: false, error: "SMS provider is not configured yet." };
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{6}$/.test(code)) return { ok: false };
  if (!PHONE_OTP_LIVE) return { ok: true }; // TEST MODE — ඕනම ඉලක්කම් 6ක්
  // TODO: SMS provider එකෙන් code එක check කරන්න (උදා: fetch("/api/otp/verify", ...))
  void phone;
  return { ok: false, error: "SMS provider is not configured yet." };
}
