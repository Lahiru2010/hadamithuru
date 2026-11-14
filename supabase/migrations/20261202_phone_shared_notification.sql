-- 20261202_phone_shared_notification.sql
-- 📞 update-60: ගැලපුණු කෙනෙක් "මගේ අංකය පෙන්වන්න" On කළාම අනිත් කෙනාට 🔔 notification එකක්
--   ("කසුන් තමන්ගේ දුරකථන අංකය ඔබට පේන්න සැලැස්සුවා")
-- මේ SQL එකෙන් කරන්නේ notifications table එකට 'phone_shared' කියන අලුත් වර්ගය ඉඩ දෙන එක විතරයි.
-- කීප පාරක් run කළත් කමක් නෑ.

do $$
declare c record; allowed text;
begin
  for c in
    select con.conname from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and rel.relname = 'notifications' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%' and pg_get_constraintdef(con.oid) not ilike '%phone_shared%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
    select string_agg(quote_literal(t), ', ') into allowed from (
      select distinct type as t from public.notifications where type is not null
      union select unnest(array['verified', 'verify_rejected', 'verify_info', 'report_reviewed', 'founding_member', 'verify_reward',
                                'referral_reward', 'story_approved', 'boost_active', 'story_confirm', 'new_interest', 'new_message',
                                'interest_accepted', 'phone_shared'])
    ) x;
    execute format('alter table public.notifications add constraint %I check (type in (%s))', c.conname, allowed);
  end loop;
end $$;

-- 🔍 Check කරන්න (කැමති නම්):
-- select type, body, link, created_at from public.notifications where type = 'phone_shared' order by created_at desc limit 10;
