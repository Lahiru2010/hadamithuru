-- Photo privacy: original + blurred versions, blur toggle
-- Supabase Dashboard → SQL Editor එකේ මේක run කරන්න.

-- 1) Columns
alter table public.profiles
  add column if not exists blur_photo boolean not null default false,
  add column if not exists photo_original_path text,
  add column if not exists photo_blurred_path text;

-- 2) avatars bucket එක PRIVATE කරනවා.
--    මේකෙන් පස්සේ public URL එකෙන් කාටවත් file එකක් ගන්න බෑ.
--    Files යන්නේ /api/avatar/<userId> route එක හරහා විතරයි (service role key එකෙන්).
update storage.buckets set public = false where id = 'avatars';

-- 3) avatars bucket එකට anon/authenticated SELECT policies තියෙනවා නම් ඒවා අයින් කරන්න ඕන,
--    නැත්නම් logged-in user කෙනෙක්ට supabase.storage.download() එකෙන් original එක ගන්න පුළුවන්.
--    මේ query එකෙන් තියෙන policies බලන්න:
--
--      select policyname, cmd, roles, qual
--      from pg_policies
--      where schemaname = 'storage' and tablename = 'objects';
--
--    'avatars' bucket එකට අදාළ SELECT policy එකක් තියෙනවා නම්:
--      drop policy "<policy name>" on storage.objects;

-- 4) Users ලට තමන්ගේ profile row එකේ photo paths / avatar_url අතින් වෙනස් කරන්න බැරි කරනවා.
--    (නැත්නම් කෙනෙක්ට තමන්ගේ row එකට වෙන කෙනෙක්ගේ original path එක දාන්න පුළුවන්.)
--    මේවා වෙනස් කරන්න පුළුවන් service role (අපේ API routes) එකට විතරයි.
create or replace function public.protect_photo_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.photo_original_path := old.photo_original_path;
    new.photo_blurred_path  := old.photo_blurred_path;
    new.avatar_url          := old.avatar_url;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_photo_columns on public.profiles;
create trigger protect_photo_columns
  before update on public.profiles
  for each row execute function public.protect_photo_columns();
