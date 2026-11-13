-- 20261126_slider_db.sql
-- 🎠 Home slider එක සම්පූර්ණයෙන්ම admin එකෙන් (Admin → Success stories → Published / slider)
--   • image_url  — public folder එකේ images (දැනට තියෙන sample slides)
--   • sort_order — slider එකේ පිළිවෙළ (↑ ↓)
--   • දැනට slider එකේ තියෙන sample slides 6 DB එකට දානවා (admin slides නැත්නම් විතරක්) — ඊට පස්සේ edit / remove කරන්න පුළුවන්
-- කීප පාරක් run කළත් කමක් නෑ.

alter table public.success_stories add column if not exists image_url text;
alter table public.success_stories add column if not exists sort_order integer not null default 0;

insert into public.success_stories (user_id, names, place, married_year, story, image_url, sort_order, consent, married, status, is_custom, show_in_slider, reviewed_at)
select a.id, v.names, v.place, v.yr, v.story, v.img, v.ord, true, true, 'approved', true, true, now()
from (values
    ('කසුන් සහ දිලිනි', 'මහනුවර', 2025, 'අපේ දෙමාපියන් තමයි පැතිකඩ හැදුවේ. අපිට වැඩියෙන්ම ආස හිතුණේ පෞද්ගලිකත්වයට — ඇය පිළිගත්තාට පස්සෙයි මට ඇගේ ඡායාරූපය පෙනුණේ. අද අපි සතුටින් විවාහ වෙලා, Seneha ට ස්තූතියි.', '/images/couples/couple-1.jpg', 1),
    ('තරිඳු සහ නෙත්මි', 'ගම්පහ', 2025, 'ගැලපීමේ ප්‍රතිශතය සහ කේන්දර ගැලපීම නිසා අපේ පවුල් දෙකටම ගොඩක් කාලය ඉතුරු වුණා. අපි Seneha එකේදී හමුවෙලා අවුරුද්දක් ඇතුළත විවාහ වුණා.', '/images/couples/couple-2.jpg', 2),
    ('ප්‍රදීප් සහ කවිතා', 'යාපනය', 2026, 'මුල්ම දවසේ ඉඳන් අපිට ආරක්ෂිත බවක් දැනුණා — අනවශ්‍ය messages නැහැ, අපි දෙන්නාම එකඟ වුණාමයි කතාබහ පටන් ගත්තේ. Seneha ට ස්තූතියි!', '/images/couples/couple-3.jpg', 3),
    ('සහන් සහ ඉෂාරා', 'මාතර', 2024, 'දෙමාපියන් විදිහට අපි තමයි දුවගේ පැතිකඩ කළමනාකරණය කළේ. පිළිගන්න කලින් පවුල ගැන හැම විස්තරයක්ම බලන්න පුළුවන් වුණ නිසා අපිට ලොකු සහනයක් දැනුණා.', '/images/couples/couple-4.jpg', 4),
    ('රුවන් සහ හිරුණි', 'කුරුණෑගල', 2025, 'මම විදේශයක වැඩ කළේ. ලංකාවේ පවුලක් එක්ක සම්බන්ධ වෙන්න Seneha ලේසි කළා. හමුවෙන්න කලින් අපි මාස ගණනක් කතා කළා, හැමදේම ආරක්ෂිත බවක් දැනුණා.', '/images/couples/couple-5.jpg', 5),
    ('රිස්වාන් සහ ෆාතිමා', 'මහනුවර', 2026, 'Publish කළ පැතිකඩ විතරක් පේන එකටත්, ඕනෑම වේලාවක අපේ පැතිකඩ සඟවන්න පුළුවන් වීමටත් අපි කැමති වුණා. මුල ඉඳන් අගට සරල, ගෞරවනීය අත්දැකීමක්.', '/images/couples/couple-6.jpg', 6)
) as v(names, place, yr, story, img, ord)
cross join lateral (
  select p.id from public.profiles p
  join public.admins ad on lower(ad.email) = lower(p.email)
  order by (ad.role = 'super_admin') desc limit 1
) a
where not exists (select 1 from public.success_stories where is_custom);

-- 🔍 පරීක්ෂා කරන්න:
-- select names, image_url, sort_order, show_in_slider from public.success_stories where is_custom order by sort_order;
