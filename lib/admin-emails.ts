// lib/admin-emails.ts
// Admin emails — browser එකටත් server එකටත් එකම list එක.
// .env.local එකේ NEXT_PUBLIC_ADMIN_EMAILS=a@x.com,b@y.com දැම්මොත් ඒක පාවිච්චි වෙනවා.
export const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "lahiru.cntr@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());
