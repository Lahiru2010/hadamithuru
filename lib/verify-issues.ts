// lib/verify-issues.ts
// 🪪 තහවුරු කිරීමේ ඉල්ලීමක ගැටලුවක් තියෙනවා නම් admin user ට යවන සූදානම් කරපු පණිවිඩ (si / en / ta).
// Admin dashboard එකේ "Message user" / "Reject" dialog එකෙන් තෝරලා, අවශ්‍ය නම් වෙනස් කරලා යවනවා.
import type { Language } from "@/lib/i18n";

export type VerifyIssueKey =
  | "id_unclear" | "back_missing" | "name_mismatch" | "dob_mismatch"
  | "id_expired" | "phone_missing" | "email_unconfirmed" | "photo_missing";

// 👇 Admin ට පේන නම (admin dashboard එක English)
export const VERIFY_ISSUE_LABELS: Record<VerifyIssueKey, string> = {
  id_unclear: "ID photo not clear",
  back_missing: "Back side missing",
  name_mismatch: "Name doesn't match profile",
  dob_mismatch: "Date of birth / age doesn't match",
  id_expired: "ID expired",
  phone_missing: "Mobile number missing",
  email_unconfirmed: "Email not confirmed",
  photo_missing: "Profile photo missing",
};

// 👇 User ට යන පණිවිඩය — user ගේ භාෂාවෙන්
const TEXT: Record<Language, Record<VerifyIssueKey, string> & { intro: string; outroReject: string; outroInfo: string; chatPrefix: string }> = {
  si: {
    intro: "ඔබේ තහවුරු කිරීමේ ඉල්ලීම අපි පරීක්ෂා කළා. මේ දේවල් ටික හදන්න ඕනේ:",
    id_unclear: "හැඳුනුම්පතේ ඡායාරූපය පැහැදිලි නැහැ / කියවන්න අමාරුයි.",
    back_missing: "හැඳුනුම්පතේ පිටුපස පැත්ත upload කරලා නැහැ.",
    name_mismatch: "හැඳුනුම්පතේ නම ඔබේ පැතිකඩේ නමට ගැලපෙන්නේ නැහැ.",
    dob_mismatch: "හැඳුනුම්පතේ උපන් දිනය / වයස ඔබේ පැතිකඩට ගැලපෙන්නේ නැහැ.",
    id_expired: "හැඳුනුම්පතේ වලංගු කාලය ඉකුත් වෙලා.",
    phone_missing: "කරුණාකර ඔබේ පැතිකඩට ජංගම දුරකථන අංකය එකතු කරන්න.",
    email_unconfirmed: "කරුණාකර ඔබේ email ලිපිනය තහවුරු කරන්න (ඔබේ inbox එකේ link එක).",
    photo_missing: "කරුණාකර පැහැදිලි profile ඡායාරූපයක් එකතු කරන්න.",
    outroReject: "කරුණාකර මේවා හදලා /verify පිටුවෙන් නැවත යවන්න.",
    outroInfo: "මේක හදපු ගමන් අපි ඔබේ ඉල්ලීම සම්පූර්ණ කරනවා. ප්‍රශ්න තියෙනවා නම් මෙතනින්ම පිළිතුරු දෙන්න.",
    chatPrefix: "🪪 තහවුරු කිරීම",
  },
  en: {
    intro: "We reviewed your verification request. Please fix the following:",
    id_unclear: "The ID photo is not clear / hard to read.",
    back_missing: "The back side of your ID wasn't uploaded.",
    name_mismatch: "The name on your ID doesn't match your profile name.",
    dob_mismatch: "The date of birth / age on your ID doesn't match your profile.",
    id_expired: "Your ID document has expired.",
    phone_missing: "Please add your mobile number to your profile.",
    email_unconfirmed: "Please confirm your email address (check the link in your inbox).",
    photo_missing: "Please add a clear profile photo.",
    outroReject: "Please fix these and submit again from the /verify page.",
    outroInfo: "Once this is fixed, we'll complete your verification. You can reply here if you have questions.",
    chatPrefix: "🪪 Verification",
  },
  ta: {
    intro: "உங்கள் சரிபார்ப்புக் கோரிக்கையைப் பரிசீலித்தோம். பின்வருவனவற்றைச் சரிசெய்யவும்:",
    id_unclear: "அடையாள அட்டையின் புகைப்படம் தெளிவாக இல்லை / படிக்க முடியவில்லை.",
    back_missing: "அடையாள அட்டையின் பின்பக்கம் பதிவேற்றப்படவில்லை.",
    name_mismatch: "அடையாள அட்டையிலுள்ள பெயர் உங்கள் சுயவிவரப் பெயருடன் பொருந்தவில்லை.",
    dob_mismatch: "அடையாள அட்டையிலுள்ள பிறந்த தேதி / வயது உங்கள் சுயவிவரத்துடன் பொருந்தவில்லை.",
    id_expired: "உங்கள் அடையாள ஆவணத்தின் செல்லுபடிக் காலம் முடிந்துவிட்டது.",
    phone_missing: "தயவுசெய்து உங்கள் சுயவிவரத்தில் கைபேசி எண்ணைச் சேர்க்கவும்.",
    email_unconfirmed: "தயவுசெய்து உங்கள் மின்னஞ்சல் முகவரியை உறுதிப்படுத்தவும் (inbox-இலுள்ள இணைப்பு).",
    photo_missing: "தயவுசெய்து தெளிவான சுயவிவரப் புகைப்படத்தைச் சேர்க்கவும்.",
    outroReject: "தயவுசெய்து இவற்றைச் சரிசெய்து /verify பக்கத்திலிருந்து மீண்டும் அனுப்பவும்.",
    outroInfo: "இதைச் சரிசெய்ததும் உங்கள் சரிபார்ப்பை முடிப்போம். கேள்விகள் இருந்தால் இங்கேயே பதிலளிக்கலாம்.",
    chatPrefix: "🪪 சரிபார்ப்பு",
  },
};

/** තෝරපු ගැටලු වලින් සම්පූර්ණ පණිවිඩය හදනවා (admin ට ඊට පස්සේ textarea එකේ වෙනස් කරන්න පුළුවන්) */
export function buildVerifyMessage(lang: Language, issues: VerifyIssueKey[], mode: "reject" | "info") {
  const T = TEXT[lang];
  const lines = issues.map((k) => `• ${T[k]}`);
  return [T.intro, ...lines, "", mode === "reject" ? T.outroReject : T.outroInfo].join("\n").trim();
}

export const verifyChatPrefix = (lang: Language) => TEXT[lang].chatPrefix;
