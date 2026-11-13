-- 20261117_interests_timestamps.sql
-- 📊 Admin dashboard → Overview error එක හදනවා: "column interests.created_at does not exist"
--   • interests table එකට created_at (ඇරයුම යැව්ව වෙලාව) සහ accepted_at (match වුණ වෙලාව)
--   • ඇරයුමක් accept වුණ ගමන් accepted_at auto දාන trigger එකක්
-- කීප පාරක් run කළත් කමක් නෑ. දැනට තියෙන ඇරයුම් වලට ඇත්ත වෙලාව දන්නේ නැති නිසා ඒවා හිස්ව (null) තියෙනවා
-- (graph එක අද දවසේ ලොකු spike එකක් පෙන්නන්නේ නැති වෙන්න).

-- 1) Columns
alter table public.interests add column if not exists created_at timestamptz;
alter table public.interests alter column created_at set default now();
alter table public.interests add column if not exists accepted_at timestamptz;

-- 2) Accept වුණ ගමන් accepted_at දානවා (ආයේ pending / reject වුණොත් අයින් කරනවා)
create or replace function public.set_interest_accepted_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from 'accepted') then
    new.accepted_at := now();
  elsif new.status <> 'accepted' then
    new.accepted_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_interest_accepted_at on public.interests;
create trigger set_interest_accepted_at
  before insert or update of status on public.interests
  for each row execute function public.set_interest_accepted_at();

-- 3) Dashboard එක ඉක්මනින් ගණන් කරන්න
create index if not exists interests_created_at_idx on public.interests (created_at);
create index if not exists interests_status_idx on public.interests (status);

-- 🔍 පරීක්ෂා කරන්න:
-- select column_name from information_schema.columns where table_name = 'interests' and column_name in ('created_at', 'accepted_at');
