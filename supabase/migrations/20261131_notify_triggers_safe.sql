-- 20261131_notify_triggers_safe.sql
-- 🐞 Fix: "Couldn't send interest: ... violates foreign key constraint notifications_user_id_fkey"
--
-- හේතුව: අලුත් කැමැත්තක් / message එකක් / accept එකක් වුණාම trigger එකක් 🔔 notification එකක් හදනවා.
--   ලැබෙන කෙනාට (receiver) login account එකක් (auth.users) නැත්නම් — උදා: SQL එකෙන් දාපු sample / test profiles —
--   notification එක හදන්න බෑ, ඒ නිසා කැමැත්ත යැවීමත් fail වුණා.
-- විසඳුම: notification එක හදන්න බැරි වුණොත් ඒක නොසලකා හරිනවා — කැමැත්ත / message එක හැමවිටම යනවා.
-- කීප පාරක් run කළත් කමක් නෑ.

-- 💌 අලුත් කැමැත්තක්
create or replace function public.notify_new_interest()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.status <> 'pending' then return new; end if;
  begin
    select split_part(coalesce(full_name, ''), ' ', 1) into v_name from public.profiles where id = new.sender_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (new.receiver_id, 'new_interest', 'new_interest', coalesce(nullif(v_name, ''), '…'), '/interests');
  exception when others then
    null; -- 👈 notification එක බැරි වුණත් කැමැත්ත යනවා
  end;
  return new;
end $$;

-- 💬 අලුත් message
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_link text := '/chat?userId=' || new.sender_id; v_id uuid;
begin
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
  exception when others then
    null; -- 👈 notification එක බැරි වුණත් message එක යනවා
  end;
  return new;
end $$;

-- 🎉 කැමැත්ත accept කළාම (යැවූ කෙනාට)
create or replace function public.notify_interest_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    begin
      select split_part(coalesce(full_name, ''), ' ', 1) into v_name from public.profiles where id = new.receiver_id;
      insert into public.notifications (user_id, type, title, body, link)
      values (new.sender_id, 'interest_accepted', 'interest_accepted', coalesce(nullif(v_name, ''), '…'), '/chat?userId=' || new.receiver_id);
    exception when others then
      null; -- 👈 notification එක බැරි වුණත් accept එක වෙනවා
    end;
  end if;
  return new;
end $$;

-- 🔍 (කැමති නම්) login account එකක් නැති profiles මොනවද — මේවා sample / test profiles:
-- select p.id, p.full_name, p.email from public.profiles p
-- where not exists (select 1 from auth.users u where u.id = p.id);
