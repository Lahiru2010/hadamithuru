-- 20261125_stories_slider.sql
-- 💍 ආදර කතා → home slider කළමනාකරණය (admin)
--   • show_in_slider — admin කැමති ඒවා විතරයි slider එකේ
--   • is_custom      — admin හදපු slides (photo + text)
--   • gift_sent_at   — 🎁 තෑග්ග යැව්වාද
-- කීප පාරක් run කළත් කමක් නෑ.

alter table public.success_stories add column if not exists show_in_slider boolean not null default true;
alter table public.success_stories add column if not exists is_custom boolean not null default false;
alter table public.success_stories add column if not exists gift_sent_at timestamptz;

-- Admin slides වල quote එක කෙටි වෙන්න පුළුවන් — අවම අකුරු 30 → 10
alter table public.success_stories drop constraint if exists success_stories_story_check;
alter table public.success_stories add constraint success_stories_story_check check (char_length(story) between 10 and 700);

-- 🔍 පරීක්ෂා කරන්න:
-- select names, status, show_in_slider, is_custom, gift_sent_at from public.success_stories order by created_at desc;
