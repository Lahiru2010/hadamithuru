-- 20261124_story_confirm.sql
-- 💍 ආදර කතා: සහකරුත් තහවුරු කරන්න ඕනේ + "විවාහ වෙලා / ගිවිස ගෙන" තහවුරුව
-- කීප පාරක් run කළත් කමක් නෑ.

alter table public.success_stories add column if not exists partner_confirmed_at timestamptz;
alter table public.success_stories add column if not exists married boolean not null default false;

-- 🔔 අලුත් notification type ('story_confirm')
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%story_confirm%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward', 'referral_reward', 'story_approved', 'boost_active', 'story_confirm'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 🔍 පරීක්ෂා කරන්න:
-- select names, partner_confirmed_at, married, status from public.success_stories order by created_at desc;
