-- 20261122_phone_shares.sql
-- 📞 දුරකථන අංකය **එක එක කෙනාට වෙන වෙනම** share කරන්න (update-31)
--   • owner_id = අංකය අයිති කෙනා · viewer_id = බලන්න අවසර දුන්න කෙනා (ගැලපුණු කෙනෙක් විතරයි — API එකෙන් check කරනවා)
--   • Default: කාටවත් නෑ. Profile popup එකේ "මගේ අංකය X ට පෙන්නන්න" switch එකෙන් on / off
--   • Chat එක ඉවත් කළාම (unmatch) දෙපැත්තෙම share අයින් වෙනවා
-- කීප පාරක් run කළත් කමක් නෑ. (කලින් update එකේ show_phone_to_matches column එක තවදුරටත් පාවිච්චි වෙන්නේ නෑ)

create table if not exists public.phone_shares (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);
alter table public.phone_shares enable row level security;
drop policy if exists "phone_shares_select_own" on public.phone_shares;
create policy "phone_shares_select_own" on public.phone_shares for select to authenticated
  using (owner_id = auth.uid() or viewer_id = auth.uid());
-- (insert / delete server එකෙන් — /api/phone — ගැලපිලාද කියලා බලලා)

-- 🔍 පරීක්ෂා කරන්න:
-- select * from public.phone_shares;
