-- 20261123_horoscope_premium.sql
-- 🔮 කේන්දරය (profile_private.horoscope) + 💎 Premium සාමාජිකයින් (Manoshi Premium කරනවා)
-- කීප පාරක් run කළත් කමක් නෑ.

-- ═════════ 1) 🔮 කේන්දරය — පෞද්ගලිකයි (profile_private, අයිතිකාරයාට විතරයි) ═════════
alter table public.profile_private add column if not exists horoscope jsonb;

-- ═════════ 2) 💎 දැනට ඉන්න Premium අය බලන්න ═════════
select p.full_name, p.email, p.premium_until, p.founding_member, p.founding_number
from public.profiles p
where p.premium_until > now()
order by p.premium_until;

-- ═════════ 3) 💎 Manoshi ව Premium කරනවා (මාස 1) ═════════
-- ⚠️ මුලින්ම මේ select එක run කරලා හරි කෙනාද කියලා බලන්න (නම දෙකක් තියෙනවා නම් email එකෙන් තෝරන්න):
select id, full_name, email, premium_until from public.profiles where full_name ilike 'manoshi%';

-- ඊට පස්සේ මේක run කරන්න (නම එක්කෙනෙක්ට විතරක් ගැලපෙනවා නම්):
with target as (
  select id from public.profiles where full_name ilike 'manoshi%' limit 1
), upd as (
  update public.profiles p
     set premium_until = greatest(coalesce(p.premium_until, now()), now()) + interval '1 month'
    from target
   where p.id = target.id
  returning p.id
)
insert into public.premium_grants (user_id, reason, months)
select id, 'admin', 1 from upd;

-- 🔍 ආයේ බලන්න:
-- select full_name, premium_until from public.profiles where full_name ilike 'manoshi%';
-- 💡 ඉස්සරහට: Admin → Pricing & boost → "Premium members" → email + මාස → Give Premium
