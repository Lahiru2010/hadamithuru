-- supabase/migrations/20261114_bookmarks_fix.sql
-- 🔖 Bookmarks — table එක, unique constraint එක සහ RLS policies හරියට තියෙනවා කියලා තහවුරු කරනවා.
-- කීප පාරක් run කළත් කමක් නෑ (idempotent). දැනට තියෙන bookmarks මැකෙන්නේ නෑ.

-- 1) Table එක (නැත්නම් විතරක් හදනවා)
create table if not exists public.bookmarks (
  user_id    uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- පරණ table එකේ created_at නැත්නම් එකතු කරනවා (Bookmarks tab එකේ පිළිවෙළට ඕන)
alter table public.bookmarks add column if not exists created_at timestamptz not null default now();

-- 2) එකම profile එක දෙපාරක් bookmark වෙලා තියෙනවා නම් එකක් ඉතුරු කරනවා
delete from public.bookmarks a
using public.bookmarks b
where a.user_id = b.user_id
  and a.profile_id = b.profile_id
  and a.ctid > b.ctid;

-- 3) (user_id, profile_id) unique — app එකේ upsert එකට මේක ඕන
create unique index if not exists bookmarks_user_profile_uidx
  on public.bookmarks (user_id, profile_id);

-- Bookmarks tab එක ඉක්මනින් load වෙන්න
create index if not exists bookmarks_user_created_idx
  on public.bookmarks (user_id, created_at desc);

-- 4) RLS — තමන්ගේ bookmarks විතරයි බලන්න / දාන්න / අයින් කරන්න පුළුවන්
alter table public.bookmarks enable row level security;

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own" on public.bookmarks
  for insert to authenticated
  with check (user_id = auth.uid() and profile_id <> auth.uid());

-- upsert (ignoreDuplicates) එකට update policy එකකුත් ඕන වෙන්න පුළුවන්
drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own" on public.bookmarks
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own" on public.bookmarks
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.bookmarks to authenticated;

-- 5) ⚡ Realtime — Interests → Bookmarks tab එක වෙන tab / device එකකින් කළත් ගමන්ම update වෙන්න
--    (replica identity full: primary key නැති table එකකත් delete events හරියට එන්න + delete කරන්න පුළුවන් වෙන්න)
alter table public.bookmarks replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime add table public.bookmarks;
  end if;
end $$;

-- 6) 🔍 පරීක්ෂා කරන්න (අවශ්‍ය නම් වෙනම run කරන්න):
-- select policyname, cmd from pg_policies where tablename = 'bookmarks';
-- select count(*) from public.bookmarks;
