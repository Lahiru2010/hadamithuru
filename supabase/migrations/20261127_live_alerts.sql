-- 20261127_live_alerts.sql
-- 🔔 අලුත් කැමැත්තක් ආපු ගමන් notification එක (realtime) — interests table එක realtime publication එකට
-- (messages දැනටමත් තියෙනවා). කීප පාරක් run කළත් කමක් නෑ.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'interests') then
    alter publication supabase_realtime add table public.interests;
  end if;
end $$;
