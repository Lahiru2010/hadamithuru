-- 20261121_phone_boost_pricing.sql
-- 🚀 update-30: 📞 ගැලපුණු අයට දුරකථන අංකය · ⚡ Profile Boost · 💰 Admin එකෙන් මිල ගණන් වෙනස් කරන්න
-- කීප පාරක් run කළත් කමක් නෑ. (20261120_growth_features.sql කලින් run කරලා තියෙන්න ඕනේ)

-- ═════════ 1) 📞 දුරකථන අංකය ගැලපුණු අයට (default: OFF) ═════════
alter table public.profile_private add column if not exists show_phone_to_matches boolean not null default false;

-- ═════════ 2) 💰 Site settings (pricing + boost) — admin එකෙන් වෙනස් කරන්න ═════════
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "app_settings_read_all" on public.app_settings;
create policy "app_settings_read_all" on public.app_settings for select to anon, authenticated using (true);
-- (ලියන්නේ server එකෙන් — service role — admin API එක හරහා විතරයි)

insert into public.app_settings (key, value) values ('pricing', '{
  "plans": [
    {"id": "free", "priceLkr": 0, "months": null, "popular": false, "enabled": true, "features": ["f_profile", "f_browse", "f_interests5", "f_chat", "f_photos"]},
    {"id": "gold", "priceLkr": 990, "months": 1, "popular": true, "enabled": true, "features": ["f_everythingFree", "f_unlimited", "f_highlight", "f_seeAll", "f_support"]},
    {"id": "platinum", "priceLkr": 1500, "months": 1, "popular": false, "enabled": true, "features": ["f_everythingGold", "f_top", "f_boost", "f_assist"]}
  ],
  "boost": {"priceLkr": 660, "days": 7, "enabled": true}
}'::jsonb) on conflict (key) do nothing;

-- ═════════ 3) ⚡ Profile Boost ═════════
alter table public.profiles add column if not exists boosted_until timestamptz;
create index if not exists profiles_boosted_until_idx on public.profiles (boosted_until) where boosted_until is not null;

create table if not exists public.boost_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  days integer not null check (days between 1 and 90),
  price_lkr integer not null check (price_lkr >= 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);
create index if not exists boost_requests_status_idx on public.boost_requests (status, created_at desc);
alter table public.boost_requests enable row level security;
drop policy if exists "boost_requests_select_own" on public.boost_requests;
create policy "boost_requests_select_own" on public.boost_requests for select to authenticated using (user_id = auth.uid());

-- Admin dashboard එකට realtime (අලුත් boost ඉල්ලීමක් ආපු ගමන් toast එකක්)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boost_requests') then
    alter publication supabase_realtime add table public.boost_requests;
  end if;
end $$;

-- ═════════ 4) 🔒 boosted_until එකත් browser එකෙන් වෙනස් කරන්න බෑ ═════════
create or replace function public.protect_reward_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin') or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.premium_until := null;
    new.founding_member := false;
    new.founding_number := null;
    new.referred_by := null;
    new.referral_code := null;
    new.boosted_until := null;
  elsif new.premium_until is distinct from old.premium_until
     or new.founding_member is distinct from old.founding_member
     or new.founding_number is distinct from old.founding_number
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.boosted_until is distinct from old.boosted_until then
    raise exception 'premium / founding / referral / boost fields are managed by the server';
  end if;
  return new;
end;
$$;

-- ═════════ 5) අලුත් notification type ('boost_active') ═════════
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%boost_active%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward', 'referral_reward', 'story_approved', 'boost_active'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 🔍 පරීක්ෂා කරන්න:
-- select value from public.app_settings where key = 'pricing';
-- select * from public.boost_requests order by created_at desc;
