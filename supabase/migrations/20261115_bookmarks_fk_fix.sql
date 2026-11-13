-- 20261115_bookmarks_fk_fix.sql
-- 🔖 Bookmark error එක හදනවා:
--    insert or update on table "bookmarks" violates foreign key constraint "bookmarks_profile_id_fkey"
-- හේතුව: profile_id එකේ foreign key එක profiles(id) වලට නෙවෙයි වෙන table / column එකකට යොමු වෙලා.
-- මේකෙන් ඒ constraint එක අයින් කරලා public.profiles(id) වලට හරියට ආපහු හදනවා. කීප පාරක් run කළත් කමක් නෑ.

-- 🔍 (කැමති නම් මුලින්ම run කරලා බලන්න — දැනට තියෙන්නේ මොකකටද කියලා)
-- select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.bookmarks'::regclass and contype = 'f';

-- 1) පරණ (වැරදි) foreign key එක අයින් කරනවා
alter table public.bookmarks drop constraint if exists bookmarks_profile_id_fkey;

-- 2) දැනට නැති profiles වලට යොමු වෙන පරණ bookmarks අයින් කරනවා (නැත්නම් අලුත් constraint එක හදන්න බෑ)
delete from public.bookmarks b
where not exists (select 1 from public.profiles p where p.id = b.profile_id);

-- 3) හරි foreign key එක — profile එක මැකුවොත් bookmark එකත් auto මැකෙනවා
alter table public.bookmarks
  add constraint bookmarks_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete cascade;

-- 🔍 පරීක්ෂා කරන්න (references public.profiles(id) කියලා පේන්න ඕනේ):
-- select conname, pg_get_constraintdef(oid) from pg_constraint where conname = 'bookmarks_profile_id_fkey';
