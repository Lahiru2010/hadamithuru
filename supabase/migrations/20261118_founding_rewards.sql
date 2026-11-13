-- 20261118_founding_rewards.sql
-- 🎁 Founding Member + verify තෑග්ග
--   • පළමු verified සාමාජිකයින් 500ට: 👑 Founding Member #N + Premium මාස 3ක් නොමිලේ
--   • ඊට පස්සේ verify වෙන හැමෝටම: Premium මාස 1ක් නොමිලේ
--   • Admin "Approve / Verify" කළ ගමන් server එකෙන් auto ලැබෙනවා (එක user කෙනෙකුට එක පාරයි)
-- ⚠️ අගයන් වෙනස් කරනවා නම්: පහළ founding_limit() / grant function එකේ + lib/offer.ts එකේ දෙකේම වෙනස් කරන්න.
-- කීප පාරක් run කළත් කමක් නෑ.

-- 1) profiles columns
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.profiles add column if not exists founding_member boolean not null default false;
alter table public.profiles add column if not exists founding_number integer;
create unique index if not exists profiles_founding_number_uidx on public.profiles (founding_number) where founding_number is not null;

-- 2) Premium දුන්න හැම වාරයකම record එකක් (පස්සේ payments / referrals වලටත් මේකම)
create table if not exists public.premium_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('founding', 'verify_reward', 'referral', 'admin', 'payment')),
  months integer not null check (months between 1 and 24),
  created_at timestamptz not null default now()
);
create unique index if not exists premium_grants_once_uidx on public.premium_grants (user_id, reason) where reason in ('founding', 'verify_reward');
alter table public.premium_grants enable row level security;
drop policy if exists "premium_grants_select_own" on public.premium_grants;
create policy "premium_grants_select_own" on public.premium_grants for select to authenticated using (user_id = auth.uid());

-- 3) Founding සීමාව (එක තැනකින් වෙනස් කරන්න)
create or replace function public.founding_limit() returns integer language sql immutable as $$ select 500 $$;

-- 4) ඉතුරු Founding ස්ථාන — site එකේ "තව ස්ථාන Xයි" පෙන්නන්න (හැමෝටම බලන්න පුළුවන්, ගණන විතරයි)
create or replace function public.founding_spots_left()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(0, public.founding_limit() - (select count(*) from public.profiles where founding_member))::integer
$$;
grant execute on function public.founding_spots_left() to anon, authenticated;

-- 5) තෑග්ග දෙන function එක (server එකේ service role එකට විතරයි)
create or replace function public.grant_verification_rewards(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_founding_months constant integer := 3;  -- 👈 Founding අයට
  v_verify_months   constant integer := 1;  -- 👈 ඊට පස්සේ verify වෙන අයට
  v_count integer;
  v_num integer;
  v_months integer;
  v_reason text;
  v_until timestamptz;
begin
  -- එකවර verify කළත් අංක දෙපාරක් වැටෙන්නේ නැති වෙන්න lock එකක්
  perform pg_advisory_xact_lock(hashtext('seneha_founding_rewards'));

  if exists (select 1 from public.premium_grants where user_id = p_user and reason in ('founding', 'verify_reward')) then
    return jsonb_build_object('granted', false);
  end if;

  select count(*) into v_count from public.profiles where founding_member;
  if v_count < public.founding_limit() then
    v_num := coalesce((select max(founding_number) from public.profiles), 0) + 1;
    v_reason := 'founding';
    v_months := v_founding_months;
    update public.profiles set founding_member = true, founding_number = v_num where id = p_user;
  else
    v_reason := 'verify_reward';
    v_months := v_verify_months;
  end if;

  insert into public.premium_grants (user_id, reason, months) values (p_user, v_reason, v_months);
  update public.profiles
    set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => v_months)
    where id = p_user
    returning premium_until into v_until;

  return jsonb_build_object('granted', true, 'reason', v_reason, 'months', v_months, 'number', v_num, 'premium_until', v_until);
end;
$$;
revoke execute on function public.grant_verification_rewards(uuid) from public, anon, authenticated;
grant execute on function public.grant_verification_rewards(uuid) to service_role;

-- 6) මේ columns browser එකෙන් කාටවත් වෙනස් කරන්න බෑ (server / admin විතරයි)
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
  elsif new.premium_until is distinct from old.premium_until
     or new.founding_member is distinct from old.founding_member
     or new.founding_number is distinct from old.founding_number then
    raise exception 'premium / founding fields are managed by the server';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_reward_columns on public.profiles;
create trigger protect_reward_columns
  before insert or update on public.profiles
  for each row execute function public.protect_reward_columns();

-- 7) අලුත් notification types ('founding_member', 'verify_reward') ඉඩ දෙනවා (type CHECK constraint එකක් තියෙනවා නම්)
do $$
declare
  c record;
  allowed text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%'
      and pg_get_constraintdef(con.oid) not ilike '%founding_member%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed
    from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 8) (කැමති නම් විතරයි) දැනටමත් verify වෙලා ඉන්න අයටත් තෑග්ග දෙන්න — කලින් verify වුණ අයට මුල් අංක.
--    ⚠️ Test accounts verify කරලා නම් මුලින්ම ඒවා unverify කරන්න, නැත්නම් ඒවා Founding ස්ථාන ගන්නවා.
--    පහළ line එක comment එකෙන් අයින් කරලා run කරන්න:
-- select public.grant_verification_rewards(id) from public.profiles where id_verified = 'Yes' order by verified_at nulls last;

-- 🔍 පරීක්ෂා කරන්න:
-- select public.founding_spots_left();
-- select id, full_name, founding_number, premium_until from public.profiles where founding_member order by founding_number;
