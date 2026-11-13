-- 20261130_publish_before_interest.sql
-- 🔒 තමන්ගේ පැතිකඩ publish කරලා නැති අයට කැමැත්ත (interest) යවන්න බෑ — browser එකෙන් වටේ ගියත් DB එකෙන් නවත්වනවා
-- කීප පාරක් run කළත් කමක් නෑ.

create or replace function public.require_published_sender()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = new.sender_id and is_published = true) then
    raise exception 'publish_required' using hint = 'Publish your profile before sending interests';
  end if;
  return new;
end $$;

drop trigger if exists require_published_sender on public.interests;
create trigger require_published_sender before insert on public.interests
  for each row execute function public.require_published_sender();

-- 🔍 පරීක්ෂා කරන්න (publish නොකළ අය):
-- select id, full_name, is_published from public.profiles where coalesce(is_published, false) = false;
