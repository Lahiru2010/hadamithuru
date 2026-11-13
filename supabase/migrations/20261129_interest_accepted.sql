-- 20261129_interest_accepted.sql
-- 🎉 ඔබ යැවූ කැමැත්තක් කවුරුහරි accept කළාම → ඔබේ 🔔 bell එකේ "කසුන් ඔබේ කැමැත්ත පිළිගත්තා!" notification එකක්
-- කීප පාරක් run කළත් කමක් නෑ.

-- 1) අලුත් notification type ('interest_accepted') ඉඩ දෙනවා
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%interest_accepted%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward', 'referral_reward', 'story_approved', 'boost_active', 'story_confirm', 'new_interest', 'new_message', 'interest_accepted'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 2) 🎉 Accept වුණ ගමන් කැමැත්ත යැවූ කෙනාට (sender) notification එක
create or replace function public.notify_interest_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select split_part(coalesce(full_name, ''), ' ', 1) into v_name from public.profiles where id = new.receiver_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (new.sender_id, 'interest_accepted', 'interest_accepted', coalesce(nullif(v_name, ''), '…'), '/chat?userId=' || new.receiver_id);
  end if;
  return new;
end $$;
drop trigger if exists notify_interest_accepted on public.interests;
create trigger notify_interest_accepted after update of status on public.interests
  for each row execute function public.notify_interest_accepted();

-- 🔍 පරීක්ෂා කරන්න:
-- select type, body, link, created_at from public.notifications where type = 'interest_accepted' order by created_at desc limit 10;
