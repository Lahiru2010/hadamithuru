// app/api/avatar/blur/route.ts
// Blur on/off කරනවා.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';
import { makePublic } from '@/lib/avatar';
import { avatarUrlFor } from '@/lib/photo';
import { makePlaceholder } from '@/lib/placeholder';

export const runtime = 'nodejs';

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const blur = body?.blur;
  if (typeof blur !== 'boolean')
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });

  const admin = createAdminClient();

  const { data: p } = await admin
    .from('profiles')
    .select('avatar_original_path, avatar_public_path, photo_original_path')
    .eq('id', user.id)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Photo එකක් නැත්නම්, නැත්නම් පරණ system එකේ photo එකක් නම් (blur version එක දැනටමත් තියෙනවා)
  // setting එක විතරක් save කරනවා
  if (!p.avatar_original_path) {
    // පරණ system එකේ photo එකක් නම් placeholder එක script එකෙන් ආයේ හදන්න ඕන (දැනට අයින් කරනවා)
    const update: Record<string, unknown> = { avatar_blur_enabled: blur, blur_photo: blur, avatar_placeholder: null };
    if (p.photo_original_path) update.avatar_url = avatarUrlFor(user.id);
    const { error } = await admin.from('profiles').update(update).eq('id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data: file, error } = await admin.storage
    .from('avatars-original')
    .download(p.avatar_original_path);
  if (error || !file) return NextResponse.json({ error: 'Original not found' }, { status: 500 });

  const publicImage = await makePublic(Buffer.from(await file.arrayBuffer()), blur);
  const placeholder = await makePlaceholder(publicImage); // 👈 Load වෙනකම් පෙන්නන පොඩි blur photo එක
  const newPath = `${user.id}/${Date.now()}.avif`;

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(newPath, publicImage, { contentType: 'image/avif' });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      avatar_blur_enabled: blur,
      blur_photo: blur,
      avatar_public_path: newPath,
      avatar_url: avatarUrlFor(user.id),
      avatar_placeholder: placeholder,
    })
    .eq('id', user.id);

  if (updateError) {
    await admin.storage.from('avatars').remove([newPath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (p.avatar_public_path) await admin.storage.from('avatars').remove([p.avatar_public_path]);

  return NextResponse.json({ ok: true });
}
