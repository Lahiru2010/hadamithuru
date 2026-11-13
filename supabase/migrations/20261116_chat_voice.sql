-- 20261116_chat_voice.sql
-- 🎤 Chat හඬ පණිවිඩ (voice notes)
--   • messages table එකට audio columns
--   • "chat-voice" private storage bucket එක (උපරිම 1.5 MB, audio වර්ග විතරයි)
--   • audio columns user ලට browser එකෙන් වෙනස් කරන්න බැරි වෙන්න trigger එකක් (server එකට විතරයි)
-- කීප පාරක් run කළත් කමක් නෑ.

-- 1) messages table එකට columns
alter table public.messages add column if not exists audio_path text;
alter table public.messages add column if not exists audio_duration integer;  -- තත්පර (උපරිම 120)
alter table public.messages add column if not exists audio_mime text;

alter table public.messages drop constraint if exists messages_audio_duration_check;
alter table public.messages add constraint messages_audio_duration_check
  check (audio_duration is null or (audio_duration between 1 and 125));

-- 2) Private bucket එක — 💾 storage ඉතුරු කරන්න file එකකට උපරිම 1.5 MB
--    (app එක Opus 16 kbps වලින් පටිගත කරනවා → විනාඩියකට ~120 KB, විනාඩි 2ට ~240 KB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-voice', 'chat-voice', false, 1572864, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
-- (Bucket එකට storage policies ඕන නෑ — upload / download දෙකම server එකේ service role එකෙන්, chat එකේ දෙන්නාට විතරයි)

-- 3) audio columns server එකට විතරයි (browser එකෙන් කාටවත් වෙනත් කෙනෙකුගේ audio file එකක් message එකකට දාන්න බෑ)
create or replace function public.protect_message_audio_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin') or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.audio_path is not null or new.audio_duration is not null or new.audio_mime is not null then
      raise exception 'audio fields are managed by the server';
    end if;
  elsif new.audio_path is distinct from old.audio_path
     or new.audio_duration is distinct from old.audio_duration
     or new.audio_mime is distinct from old.audio_mime then
    raise exception 'audio fields are managed by the server';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_message_audio_columns on public.messages;
create trigger protect_message_audio_columns
  before insert or update on public.messages
  for each row execute function public.protect_message_audio_columns();

-- 🔍 පරීක්ෂා කරන්න:
-- select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'chat-voice';
-- select column_name from information_schema.columns where table_name = 'messages' and column_name like 'audio%';
