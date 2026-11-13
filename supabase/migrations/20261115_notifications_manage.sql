-- 20261115_notifications_manage.sql
-- 🔔 User ට තමන්ගේ notifications කියෙව්වා / නොකියෙව්වා කරන්න, එකින් එක මකන්න, සියල්ල මකන්න පුළුවන් වෙන්න.
-- කීප පාරක් run කළත් කමක් නෑ.

alter table public.notifications enable row level security;

-- කියෙව්වා / නොකියෙව්වා (read_at වෙනස් කරන්න)
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- මකන්න
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (user_id = auth.uid());

grant select, update, delete on public.notifications to authenticated;

-- එක වැඩිපුර index එකක් — notification list එක ඉක්මනින් load වෙන්න
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- 🔍 පරීක්ෂා කරන්න:
-- select policyname, cmd from pg_policies where tablename = 'notifications';
