// app/api/avatar/me/route.ts
// My Profile page එකට: තමන්ගේ photo URL එක සහ blur setting එක.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';
import { avatarUrlFor } from '@/lib/photo';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: p } = await admin
    .from('profiles')
    .select('avatar_url, avatar_original_path, avatar_blur_enabled, photo_original_path, blur_photo')
    .eq('id', user.id)
    .maybeSingle();

  const usesNew = !!p?.avatar_original_path;
  const hasPhoto = usesNew || !!p?.photo_original_path;
  const blurEnabled = usesNew ? !!p?.avatar_blur_enabled : !!p?.blur_photo;

  // Owner ට /api/avatar/<id> එකෙන් හැමවිටම original එකම ලැබෙනවා
  const originalUrl = hasPhoto ? (p?.avatar_url ?? avatarUrlFor(user.id)) : null;

  return NextResponse.json({ originalUrl, publicUrl: null, blurEnabled });
}