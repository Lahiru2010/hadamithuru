-- 20261120_growth_features.sql
-- 🚀 update-29: 💞 Partner preferences · 🎁 Refer a friend · 💍 Success stories
-- ⚠️ Code එක (update-29) දාන්න කලින් / ඒ එක්කම මේක run කරන්න. කීප පාරක් run කළත් කමක් නෑ.
-- (20261118_founding_rewards.sql සහ 20261119_founding_50_one_month.sql කලින් run කරලා තියෙන්න ඕනේ)

-- ═════════ 1) 💞 Partner preferences ═════════
alter table public.profiles add column if not exists partner_prefs jsonb not null default '{}'::jsonb;

-- ═════════ 2) 🎁 Refer a friend ═════════
--   • හැම කෙනෙකුටම refer code එකක් (උදා: 7KQ2MXA)
--   • යාළුවා link එකෙන් register වෙලා, **admin verify කළාම** → යාළුවාට Premium මාසයක්
--   • Refer කරපු කෙනාටත් මාසයක් — ඒ කෙනත් verify වෙලා නම් විතරයි (නැත්නම් verify වෙනකම් රැඳෙනවා)
--   • අවුරුද්දකට refer තෑගි උපරිම මාස 6යි
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
update public.profiles set referral_code = upper(substr(md5(id::text || random()::text), 1, 7)) where referral_code is null;
create unique index if not exists profiles_referral_code_uidx on public.profiles (referral_code);

create or replace function public.set_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substr(md5(new.id::text || random()::text), 1, 7));
  end if;
  return new;
end $$;
drop trigger if exists set_referral_code on public.profiles;
create trigger set_referral_code before insert on public.profiles for each row execute function public.set_referral_code();

create table if not exists public.referrals (
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid primary key references public.profiles(id) on delete cascade, -- 👈 එක කෙනෙක්ව refer කරන්න පුළුවන් එක පාරයි
  created_at timestamptz not null default now(),
  referred_rewarded_at timestamptz,
  referrer_rewarded_at timestamptz,
  referrer_reward_months integer not null default 0 -- 👈 refer කරපු කෙනාට ඇත්තටම ලැබුණ මාස (උපරිම සීමාවට)
);
alter table public.referrals add column if not exists referrer_reward_months integer not null default 0;
alter table public.referrals enable row level security;
drop policy if exists "referrals_select_own" on public.referrals;
create policy "referrals_select_own" on public.referrals for select to authenticated using (referrer_id = auth.uid() or referred_id = auth.uid());

-- අලුත් user කෙනෙක් refer code එක claim කරනවා (register වෙලා දවස් 7ක් ඇතුළත, තමන්ගේම code එක නෙවෙයි)
create or replace function public.claim_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_ref uuid;
begin
  if v_me is null or p_code is null then return false; end if;
  select id into v_ref from public.profiles where referral_code = upper(trim(p_code));
  if v_ref is null or v_ref = v_me then return false; end if;
  if exists (select 1 from public.referrals where referred_id = v_me) then return false; end if;
  if not exists (select 1 from public.profiles where id = v_me and created_at > now() - interval '7 days') then return false; end if;
  insert into public.referrals (referrer_id, referred_id) values (v_ref, v_me);
  update public.profiles set referred_by = v_ref where id = v_me and referred_by is null;
  return true;
end;
$$;
grant execute on function public.claim_referral(text) to authenticated;

-- Premium එකතු කරන පොදු helper එක
create or replace function public.add_premium(p_user uuid, p_reason text, p_months integer)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare v_until timestamptz;
begin
  insert into public.premium_grants (user_id, reason, months) values (p_user, p_reason, p_months);
  update public.profiles
    set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => p_months)
    where id = p_user returning premium_until into v_until;
  return v_until;
end;
$$;
revoke execute on function public.add_premium(uuid, text, integer) from public, anon, authenticated;

-- Verify වුණ ගමන් (admin approve) — server එකෙන් call කරනවා. තෑගි ලැබුණ අයගේ list එක return කරනවා (notifications වලට)
create or replace function public.grant_referral_rewards(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_months constant integer := 1;   -- 👈 refer තෑග්ග (මාස)
  v_year_cap constant integer := 6; -- 👈 අවුරුද්දකට උපරිම
  r record;
  v_rewarded uuid[] := '{}';
begin
  perform pg_advisory_xact_lock(hashtext('seneha_referral_rewards'));

  -- (a) මම refer වෙලා ආපු කෙනෙක් නම් → මට තෑග්ග
  for r in select * from public.referrals where referred_id = p_user and referred_rewarded_at is null loop
    perform public.add_premium(p_user, 'referral', v_months);
    update public.referrals set referred_rewarded_at = now() where referred_id = p_user;
    v_rewarded := v_rewarded || p_user;
  end loop;

  -- (b) Refer කරපු අයට (ඔවුන් verify වෙලා, යාළුවා verify වෙලා, තාම තෑග්ග නොලැබුණ ඒවා) — p_user දෙපැත්තෙන්ම
  for r in
    select f.* from public.referrals f
    join public.profiles a on a.id = f.referrer_id and a.id_verified = 'Yes'
    join public.profiles b on b.id = f.referred_id and b.id_verified = 'Yes'
    where f.referrer_rewarded_at is null and (f.referred_id = p_user or f.referrer_id = p_user)
  loop
    if (select coalesce(sum(referrer_reward_months), 0) from public.referrals
        where referrer_id = r.referrer_id and referrer_rewarded_at > now() - interval '1 year') + v_months <= v_year_cap then
      perform public.add_premium(r.referrer_id, 'referral', v_months);
      v_rewarded := v_rewarded || r.referrer_id;
      update public.referrals set referrer_reward_months = v_months where referred_id = r.referred_id;
    end if;
    update public.referrals set referrer_rewarded_at = now() where referred_id = r.referred_id;
  end loop;

  return jsonb_build_object('rewarded', to_jsonb(v_rewarded), 'months', v_months);
end;
$$;
revoke execute on function public.grant_referral_rewards(uuid) from public, anon, authenticated;
grant execute on function public.grant_referral_rewards(uuid) to service_role;

-- ═════════ 3) 🔒 premium / founding / referral columns browser එකෙන් වෙනස් කරන්න බෑ ═════════
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
    new.referral_code := null; -- 👈 set_referral_code trigger එක අලුත් එකක් දානවා
  elsif new.premium_until is distinct from old.premium_until
     or new.founding_member is distinct from old.founding_member
     or new.founding_number is distinct from old.founding_number
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by then
    raise exception 'premium / founding / referral fields are managed by the server';
  end if;
  return new;
end;
$$;
-- (trigger පිළිවෙළ: protect_reward_columns → set_referral_code — අකුරු පිළිවෙළට run වෙනවා, ඒ නිසා අලුත් code එක ඉතුරු වෙනවා)

-- ═════════ 4) 💍 Success stories ═════════
create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid references public.profiles(id) on delete set null,
  names text not null check (char_length(names) between 3 and 80),
  place text check (char_length(place) <= 60),
  married_year integer check (married_year between 2020 and 2100),
  story text not null check (char_length(story) between 30 and 700),
  photo_path text,
  consent boolean not null default false check (consent),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists success_stories_status_idx on public.success_stories (status, created_at desc);
alter table public.success_stories enable row level security;
drop policy if exists "stories_select_own" on public.success_stories;
create policy "stories_select_own" on public.success_stories for select to authenticated using (user_id = auth.uid());
-- (insert / approve server එකෙන් — service role. Home එකේ approved ඒවා server API එකෙන්)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('success-stories', 'success-stories', false, 3145728, array['image/avif', 'image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ═════════ 5) අලුත් notification types ═════════
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%referral_reward%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward', 'referral_reward', 'story_approved'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 🔍 පරීක්ෂා කරන්න:
-- select referral_code from public.profiles limit 5;
-- select * from public.referrals;
-- select id, names, status from public.success_stories order by created_at desc;
