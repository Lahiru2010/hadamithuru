-- 20261203_free_interest_limit.sql
-- 💌 update-65: Free පැකේජයට මාසයකට කැමැත්ත 5යි. Gold / Premium (premium_until තවම ඉවර නැති) අයට සීමාවක් නෑ.
--   Site එකේ ලස්සන පණිවිඩය පෙන්නන්නේ browser එකෙන්. මේ trigger එක තමයි ඇත්තටම නවත්වන්නේ (කවුරුහරි කෙලින්ම API එකට යැව්වත්).
--   මාසය ගණන් කරන්නේ ලංකා වේලාවෙන් (Asia/Colombo) — 1 වෙනිදා 00:00 ඉඳන්.
-- කීප පාරක් run කළත් කමක් නෑ.

create or replace function public.enforce_free_interest_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_limit constant integer := 5;          -- 👈 Free සීමාව (මාසයකට)
  v_premium timestamptz;
  v_used integer;
  v_month_start timestamptz := (date_trunc('month', now() at time zone 'Asia/Colombo')) at time zone 'Asia/Colombo';
begin
  select premium_until into v_premium from public.profiles where id = new.sender_id;
  if v_premium is not null and v_premium > now() then
    return new; -- 👑 Gold / Premium — සීමාවක් නෑ
  end if;

  select count(*) into v_used from public.interests
   where sender_id = new.sender_id and created_at >= v_month_start;

  if v_used >= v_limit then
    raise exception 'free_interest_limit: Free plan allows % interests per month', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists free_interest_limit on public.interests;
create trigger free_interest_limit before insert on public.interests
  for each row execute function public.enforce_free_interest_limit();

-- 🔍 Check කරන්න (කැමති නම්) — මේ මාසයේ එක එක්කෙනා යවපු කැමැත්ත ගණන:
-- select p.full_name, count(*) from public.interests i join public.profiles p on p.id = i.sender_id
--  where i.created_at >= (date_trunc('month', now() at time zone 'Asia/Colombo')) at time zone 'Asia/Colombo'
--  group by p.full_name order by 2 desc;
