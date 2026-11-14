-- 20261205_payhere_payments.sql
-- 💳 update-67: PayHere online ගෙවීම් (Gold / Platinum / Boost)
--   1) profiles.premium_plan  — 'gold' / 'platinum' (ගෙවපු පැකේජය)
--   2) payments table         — හැම ගෙවීමකම record එක (pending → paid / failed / cancelled / chargeback)
--   3) complete_payment()     — PayHere "notify" එක ආවම (server එකෙන් විතරයි) Premium / Boost දෙනවා — එක පාරයි
--   4) 'premium_active' notification වර්ගය
-- කීප පාරක් run කළත් කමක් නෑ.

-- ═════════ 1) 👑 ගෙවපු පැකේජය ═════════
alter table public.profiles add column if not exists premium_plan text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_premium_plan_check') then
    alter table public.profiles add constraint profiles_premium_plan_check check (premium_plan is null or premium_plan in ('gold', 'platinum'));
  end if;
end $$;

-- 🔒 premium_plan එකත් browser එකෙන් වෙනස් කරන්න බෑ (කලින් තිබ්බ guard එකට එකතු කළා)
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
    new.premium_plan := null;
    new.founding_member := false;
    new.founding_number := null;
    new.referred_by := null;
    new.referral_code := null;
    new.boosted_until := null;
  elsif new.premium_until is distinct from old.premium_until
     or new.premium_plan is distinct from old.premium_plan
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

-- ═════════ 2) 💳 ගෙවීම් ═════════
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,                       -- අපි හදන අංකය (PayHere එකටත් යනවා)
  user_id uuid references public.profiles(id) on delete set null,
  item text not null check (item in ('gold', 'platinum', 'boost')),
  months integer,                                       -- Gold / Platinum කාලය
  days integer,                                         -- Boost දින
  amount numeric(10, 2) not null,
  currency text not null default 'LKR',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'chargeback')),
  payhere_payment_id text,
  method text,                                          -- VISA / MASTER / EZCASH ...
  status_message text,
  granted_until timestamptz,                            -- Premium / Boost ඉවර වෙන දිනය (ගෙවලා දුන්නාට පස්සේ)
  raw jsonb,                                            -- PayHere එවපු notify එක (card අංක එන්නේ නෑ)
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

alter table public.payments enable row level security;
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments for select to authenticated using (user_id = auth.uid());
-- insert / update කරන්නේ server එකෙන් විතරයි (service role) — browser එකට policy නෑ

-- ═════════ 3) ✅ ගෙවීම සම්පූර්ණයි → Premium / Boost (එක පාරයි — PayHere notify එක දෙපාරක් ආවත්) ═════════
create or replace function public.complete_payment(
  p_order text, p_payment_id text, p_method text, p_amount numeric, p_currency text, p_raw jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.payments%rowtype;
  v_until timestamptz;
  v_cur_plan text;
  v_cur_until timestamptz;
begin
  select * into v from public.payments where order_id = p_order for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if v.status = 'paid' then return jsonb_build_object('ok', true, 'already', true); end if;

  -- 💰 මුදල / මුදල් වර්ගය අපි ඉල්ලපු එකමද? (නැත්නම් දෙන්නේ නෑ)
  if round(p_amount, 2) <> round(v.amount, 2) or upper(p_currency) <> upper(v.currency) then
    update public.payments set status = 'failed', status_message = 'amount_mismatch', raw = p_raw where id = v.id;
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch');
  end if;
  if v.user_id is null then
    update public.payments set status = 'paid', paid_at = now(), payhere_payment_id = p_payment_id, method = p_method, raw = p_raw, status_message = 'no_user' where id = v.id;
    return jsonb_build_object('ok', false, 'reason', 'no_user');
  end if;

  if v.item in ('gold', 'platinum') then
    select premium_plan, premium_until into v_cur_plan, v_cur_until from public.profiles where id = v.user_id;
    v_until := public.add_premium(v.user_id, 'payment', coalesce(v.months, 1));
    -- 👑 Platinum සක්‍රියව තියෙද්දී Gold ගත්තත් Platinum ම තියෙනවා
    update public.profiles
      set premium_plan = case when v.item = 'gold' and v_cur_plan = 'platinum' and v_cur_until > now() then 'platinum' else v.item end
      where id = v.user_id;
    -- 💎 Platinum = සෙවීමේ ඉහළින්ම → පැකේජ කාලය පුරාම Boost
    if v.item = 'platinum' then
      update public.profiles set boosted_until = greatest(coalesce(boosted_until, now()), v_until) where id = v.user_id;
      insert into public.boost_requests (user_id, days, price_lkr, status, admin_note, activated_at)
        values (v.user_id, least(90, greatest(1, ceil(extract(epoch from (v_until - now())) / 86400)::int)), 0, 'active', 'platinum', now());
    end if;
    insert into public.notifications (user_id, type, title, body, link)
      values (v.user_id, 'premium_active', v.item, v_until::text, '/pricing');
  else
    -- ⚡ Boost
    update public.profiles
      set boosted_until = greatest(coalesce(boosted_until, now()), now()) + make_interval(days => coalesce(v.days, 7))
      where id = v.user_id returning boosted_until into v_until;
    insert into public.boost_requests (user_id, days, price_lkr, status, admin_note, activated_at)
      values (v.user_id, least(90, greatest(1, coalesce(v.days, 7))), round(v.amount)::int, 'active', 'payhere', now());
    insert into public.notifications (user_id, type, title, body, link)
      values (v.user_id, 'boost_active', 'boost_active', v_until::text, '/pricing');
  end if;

  update public.payments
    set status = 'paid', paid_at = now(), payhere_payment_id = p_payment_id, method = p_method, raw = p_raw,
        granted_until = v_until, status_message = null
    where id = v.id;
  return jsonb_build_object('ok', true, 'until', v_until);
end;
$$;
revoke execute on function public.complete_payment(text, text, text, numeric, text, jsonb) from public, anon, authenticated;

-- ═════════ 4) 🔔 'premium_active' notification වර්ගය ═════════
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%premium_active%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward',
                                'referral_reward', 'story_approved', 'boost_active', 'story_confirm', 'new_interest', 'new_message',
                                'interest_accepted', 'phone_shared', 'premium_active'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 🔍 Check කරන්න (කැමති නම්):
-- select order_id, item, amount, status, method, granted_until, created_at from public.payments order by created_at desc limit 20;
