// app/api/avatar/route.ts
// අලුත් profile photo එකක් upload කරනවා.
// Original එක → avatars-original (private), blur/public version එක → avatars (private).
// Browser එකට යන්නේ /api/avatar/<userId> URL එක විතරයි (profiles.avatar_url).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';
import { makeOriginal, makePublic } from '@/lib/avatar';
import { avatarUrlFor } from '@/lib/photo';
import { makePlaceholder } from '@/lib/placeholder';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  const blur = form.get('blur') === 'true';

  if (!(file instanceof File) || !file.type.startsWith('image/'))
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });

  const admin = createAdminClient();

  const { data: old, error: fetchError } = await admin
    .from('profiles')
    .select('avatar_original_path, avatar_public_path, photo_original_path, photo_blurred_path')
    .eq('id', user.id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!old) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  let original: Buffer;
  let publicImage: Buffer;
  let placeholder: string;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    original = await makeOriginal(input);
    publicImage = await makePublic(original, blur);
    placeholder = await makePlaceholder(publicImage); // 👈 Load වෙනකම් පෙන්නන පොඩි blur photo එක
  } catch {
    return NextResponse.json({ error: 'Please upload a JPG, PNG or WEBP image' }, { status: 400 });
  }

  const path = `${user.id}/${Date.now()}.avif`;

  const [o, p] = await Promise.all([
    admin.storage.from('avatars-original').upload(path, original, { contentType: 'image/avif' }),
    admin.storage.from('avatars').upload(path, publicImage, { contentType: 'image/avif' }),
  ]);
  if (o.error || p.error) {
    console.error('Upload error:', o.error, p.error);
    await Promise.all([
      admin.storage.from('avatars-original').remove([path]),
      admin.storage.from('avatars').remove([path]),
    ]);
    return NextResponse.json({ error: (o.error ?? p.error)?.message }, { status: 500 });
  }

  const avatarUrl = avatarUrlFor(user.id);

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      avatar_original_path: path,
      avatar_public_path: path,
      avatar_blur_enabled: blur,
      blur_photo: blur,
      avatar_url: avatarUrl,
      avatar_placeholder: placeholder,
      // පරණ system එකේ paths තවදුරටත් ඕන නෑ
      photo_original_path: null,
      photo_blurred_path: null,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Profile update error:', updateError);
    await Promise.all([
      admin.storage.from('avatars-original').remove([path]),
      admin.storage.from('avatars').remove([path]),
    ]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // පරණ files අයින් කරනවා (අලුත් සහ පරණ system දෙකෙන්ම)
  const oldOriginals = [old.avatar_original_path].filter(Boolean) as string[];
  const oldInAvatars = [old.avatar_public_path, old.photo_original_path, old.photo_blurred_path].filter(Boolean) as string[];
  await Promise.all([
    oldOriginals.length ? admin.storage.from('avatars-original').remove(oldOriginals) : null,
    oldInAvatars.length ? admin.storage.from('avatars').remove(oldInAvatars) : null,
  ]);

  return NextResponse.json({ ok: true, avatarUrl });
}
