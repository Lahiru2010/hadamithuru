// app/api/avatar/[userId]/route.ts
// Site එකේ හැම තැනම profile photo එක එන්නේ මේ URL එකෙන් (/api/avatar/<userId>).
// බලන කෙනාට අනුව හරි version එක server එකෙන්ම තීරණය කරලා image එක යවනවා:
//   - Blur off නම්               → original එක හැමෝටම
//   - Blur on, තමන්ම බලනවා නම්    → original එක
//   - Blur on, interest accept   → original එක
//   - අනිත් හැමෝටම               → blur කරපු එක
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { isAdminEmail } from '@/lib/admin-emails';
import { createAdminClient } from '@/lib/admin';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type FileRef = { bucket: string; path: string } | null;

function notFound() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!UUID.test(userId)) return notFound();

  // getClaims() එක login token එක server එකේදීම check කරනවා
  // (getUser() වගේ හැම image එකකටම Supabase එකට අමතර request එකක් යවන්නේ නෑ)
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = (claimsData?.claims?.sub as string | undefined) ?? null;
  // 👇 Admin ට ඇත්ත photo එක — admin dashboard එකෙන් (?admin=1) බලනකොට විතරයි.
  //    Admin කෙනෙක් සාමාන්‍ය user කෙනෙක් වගේ browse කරනකොට අනිත් අයට වගේම blur එක පේනවා.
  const adminMode = new URL(req.url).searchParams.get('admin') === '1';
  const viewerIsAdmin = adminMode && isAdminEmail(claimsData?.claims?.email as string | undefined);

  const admin = createAdminClient();

  // Profile එකයි accept status එකයි එකවර (parallel) ගන්නවා
  const [{ data: p }, acceptedRes] = await Promise.all([
    admin
      .from('profiles')
      .select('avatar_original_path, avatar_public_path, avatar_blur_enabled, photo_original_path, photo_blurred_path, blur_photo')
      .eq('id', userId)
      .maybeSingle(),
    viewerId && viewerId !== userId
      ? admin
          .from('interests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(
            `and(sender_id.eq.${viewerId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${viewerId})`
          )
      : Promise.resolve({ count: 0 }),
  ]);

  if (!p) return notFound();

  // අලුත් system එකේ photo එකක් තියෙනවා නම් ඒක, නැත්නම් පරණ system එකේ photo එක
  const usesNew = !!p.avatar_original_path;
  const blurOn = usesNew ? !!p.avatar_blur_enabled : !!p.blur_photo;

  const original: FileRef = usesNew
    ? { bucket: 'avatars-original', path: p.avatar_original_path }
    : p.photo_original_path
      ? { bucket: 'avatars', path: p.photo_original_path }
      : null;

  const blurred: FileRef = usesNew
    ? p.avatar_public_path ? { bucket: 'avatars', path: p.avatar_public_path } : null
    : p.photo_blurred_path ? { bucket: 'avatars', path: p.photo_blurred_path } : null;

  if (!original) return notFound();

  const accepted = (acceptedRes.count ?? 0) > 0;
  const canSeeOriginal = !blurOn || viewerId === userId || accepted || viewerIsAdmin;

  const target = canSeeOriginal ? original : blurred;
  if (!target) return notFound();

  const { data: file, error } = await admin.storage.from(target.bucket).download(target.path);
  if (error || !file) return notFound();

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.type || 'image/jpeg',
      // Original එක browser එකේ විනාඩි 10ක් cache කරනවා (ආයේ ආවම ක්ෂණිකව පේනවා).
      // Blur එක cache කරන්නේ නෑ — interest එක accept කළ ගමන් original එක පේන්න ඕන නිසා.
      'Cache-Control': canSeeOriginal ? 'private, max-age=600' : 'no-store',
      Vary: 'Cookie',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
