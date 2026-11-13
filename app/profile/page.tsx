// app/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import ProfileWizard from "@/components/ProfileWizard";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-background">
      {/* 👇 පළල About page එකට සමානයි (max-w-5xl) — pages අතර consistency එකට */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* 👇 Profile details පියවරෙන් පියවර ඇතුළත් කරන wizard එක (photo එකත් එක පියවරක්) */}
        <ProfileWizard userId={user.id} />
      </div>
    </main>
  );
}
