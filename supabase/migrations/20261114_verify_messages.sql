-- supabase/migrations/20261114_verify_messages.sql
-- 🪪 Verification ගැටලු ගැන user ට පණිවිඩ (notification type එක: 'verify_info')
-- notifications.type එකට CHECK constraint එකක් (ඉඩ දීලා තියෙන types list එකක්) තියෙනවා නම්
-- 'verify_info' එකත් එකතු කරනවා. Constraint එකක් නැත්නම් මුකුත් කරන්නේ නෑ. කීප පාරක් run කළත් කමක් නෑ.

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
    where ns.nspname = 'public'
      and rel.relname = 'notifications'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%'
      and pg_get_constraintdef(con.oid) not ilike '%verify_info%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);

    -- දැනට තියෙන හැම type එකක්ම + අලුත් එක ඉඩ දෙනවා (පරණ rows කැඩෙන්නේ නෑ)
    select string_agg(quote_literal(t), ', ') into allowed
    from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed'])
    ) x;

    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- verification_requests.admin_note — pending ඉල්ලීමකටත් පණිවිඩය තියාගන්න (column එක නැත්නම් විතරක් හදනවා)
alter table public.verification_requests add column if not exists admin_note text;

-- 🔍 පරීක්ෂා කරන්න:
-- select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.notifications'::regclass;
