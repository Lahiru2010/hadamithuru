-- 20261128_bell_notifications.sql
-- 🔔 අලුත් කැමැත්තක් / අලුත් message එකක් → navbar එකේ 🔔 bell එකේ notification එකක් (toast නෑ)
--   • new_interest — කවුරුහරි ඔබට කැමැත්තක් එව්වාම
--   • new_message  — එක කෙනෙකුගෙන් නොකියවපු messages එක notification එකකට එකතු වෙනවා (bell එක පිරෙන්නේ නෑ)
-- කීප පාරක් run කළත් කමක් නෑ.

-- 1) අලුත් notification types ඉඩ දෙනවා
do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%new_message%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward', 'referral_reward', 'story_approved', 'boost_active', 'story_confirm', 'new_interest', 'new_message'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 2) 💌 අලුත් කැමැත්තක්
create or replace function public.notify_new_interest()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.status <> 'pending' then return new; end if;
  select split_part(coalesce(full_name, ''), ' ', 1) into v_name from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, link)
  values (new.receiver_id, 'new_interest', 'new_interest', coalesce(nullif(v_name, ''), '…'), '/interests');
  return new;
end $$;
drop trigger if exists notify_new_interest on public.interests;
create trigger notify_new_interest after insert on public.interests for each row execute function public.notify_new_interest();

-- 3) 💬 අලුත් message — එකම කෙනාගෙන් නොකියවපු notification එකක් තියෙනවා නම් ඒකම අලුත් කරනවා
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_link text := '/chat?userId=' || new.sender_id; v_id uuid;
begin
  select split_part(coalesce(full_name, ''), ' ', 1) into v_name from public.profiles where id = new.sender_id;
  select id into v_id from public.notifications
   where user_id = new.receiver_id and type = 'new_message' and link = v_link and read_at is null
   order by created_at desc limit 1;
  if v_id is not null then
    update public.notifications set created_at = now(), body = coalesce(nullif(v_name, ''), '…') where id = v_id;
  else
    insert into public.notifications (user_id, type, title, body, link)
    values (new.receiver_id, 'new_message', 'new_message', coalesce(nullif(v_name, ''), '…'), v_link);
  end if;
  return new;
end $$;
drop trigger if exists notify_new_message on public.messages;
create trigger notify_new_message after insert on public.messages for each row execute function public.notify_new_message();

-- 🔍 පරීක්ෂා කරන්න:
-- select type, body, link, read_at, created_at from public.notifications where type in ('new_interest','new_message') order by created_at desc limit 20;
