-- 20261204_hide_non_srilankan_names.sql
-- 🇱🇰 update-65: Browse list එකේ ලාංකික නොවන (ඉංග්‍රීසි / විදේශීය) නම් තියෙන ගිණුම් හංගනවා.
--   ⚠️ මකන්නේ නෑ — is_published = false කරනවා විතරයි (Browse එකේ පේන්නේ නෑ). ආපහු ගන්න පුළුවන් (පහළ "UNDO").
--   නම ලාංකිකද කියලා බලන්නේ: සිංහල / දෙමළ අකුරු තියෙනවා නම්, නැත්නම් පහළ ලැයිස්තුවේ ලාංකික නම් / වාසගම් එකක් තියෙනවා නම්.
--   ඒ නිසා මුලින්ම STEP 1 run කරලා list එක බලන්න. ලාංකික නමක් වැරදීමකින් list එකේ ආවොත් ඒ වචනය sl_name_words එකට එකතු කරන්න.

-- 🧩 ලාංකික නම් / වාසගම් (lowercase) — ඕන නම් තව එකතු කරන්න
create or replace function public.sl_name_words() returns text[] language sql immutable as $$
  select array[
    -- වාසගම්
    'perera','fernando','silva','de','desilva','mendis','jayasinghe','jayawardena','jayawardene','wickramasinghe','wickremasinghe',
    'wijesinghe','wijeratne','bandara','dissanayake','dissanayaka','rathnayake','ratnayake','herath','gunawardena','gunawardene',
    'gunasekara','gunasekera','senanayake','kumara','kumari','rajapaksa','rajapakse','ranasinghe','karunaratne','karunarathna',
    'amarasinghe','abeysekara','abeysekera','samarasinghe','weerasinghe','liyanage','peiris','pieris','cooray','rodrigo','nanayakkara',
    'ekanayake','kodikara','weerasekara','wanigasekara','jayasuriya','jayasekara','fonseka','munasinghe','hettiarachchi','dharmasena',
    'premadasa','sirisena','kariyawasam','senaratne','senarath','wijesekara','karunanayake','rajapakshe','gamage','pathirana',
    'jayaweera','wickramaratne','wijewardena','abeywickrama','samaraweera','siriwardena','gunathilaka','gunathilake','tennakoon',
    'mudalige','wanniarachchi','kularatne','hewage','madushanka','jayalath','dayaratne','galappaththi','edirisinghe','alwis',
    -- සිංහල මුල් නම්
    'kasun','dilini','nethmi','sanduni','tharushi','dinithi','kavindu','pasindu','sachini','ishara','chamari','hasini','nadeesha',
    'malsha','dulani','gayani','sewwandi','imesha','hiruni','piumi','shehani','dilshan','tharindu','chamod','isuru','ruwan','sampath',
    'chaminda','nimal','sunil','ajith','ranil','mahinda','gamini','lasith','kusal','dhananjaya','dasun','wanindu','charith','dimuth',
    'upul','suranga','ravindu','thilina','sahan','nimali','buddhika','harsha','chathura','nalaka','ruwini','nirosha','rasika','tharaka',
    'lahiru','janaka','shanaka','malith','yasiru','sajith','pramod','thisara','vihanga','sithum','maleesha','amaya','senuri','oshadi',
    'kaveesha','kalani','ashan','nishantha','chandana','madhavi','shanika','udeshika','thilini','harini','menaka','vishmi','dulmini',
    'deleep','dileepa','chathuranga','sandaruwan','lakmal','prasad','nuwan','madushani','sachith','kavinda','hasitha','nipuni',
    'dulanjali','sanjeewa','dinesh','asanka','roshan','thushara','priyantha','sudesh','anura','saman','kamal','sunethra','kumudu',
    'chathurika','iresha','nayomi','upeksha','hansika','ishani','kaushalya','dilrukshi','sandamali','madara','ayesha','dinusha',
    'pubudu','supun','chanaka','dhanushka','gihan','heshan','kanishka','lakshan','manoj','nadun','oshada','pathum','randika',
    'sachin','shehan','thimira','udara','viraj','yasas','anjana','bhagya','chamodi','erandi','geethika','hiranya','inoka','jeewani',
    -- දෙමළ නම්
    'kumar','kumaran','sivakumar','rajan','suresh','ganesh','murali','prakash','selvam','sivanesan','thevarajah','rajendran','krishnan',
    'nadarajah','balasubramaniam','sivaraj','kandiah','ponnambalam','yogarajah','thamilini','kavitha','sujatha','lakshmi','nirmala',
    'shanthi','malathi','vani','ramesh','ganeshan','sathish','vinoth','arun','karthik','thanuja','tharshini','vithya','kajan','nirojan',
    'sivapalan','arulanantham','thayalan','pirasanth','keerthana','kowsalya','mathivathani','sinthuja',
    -- මුස්ලිම් නම්
    'mohamed','mohammed','muhammad','ahamed','ahmed','fathima','fatima','rizwan','rizna','nazeer','fazil','faizal','ismail','hussain',
    'rifkhan','riyas','imran','rimzan','sameer','nusrath','aysha','zainab','nafeesa','shifana','rishad','mufeeth','marikar','farook'
  ]::text[]
$$;

-- ✅ නම ලාංකිකද?
create or replace function public.is_sl_name(p_name text) returns boolean language sql immutable as $$
  select coalesce(p_name, '') ~ '[඀-෿஀-௿]'                         -- සිංහල / දෙමළ අකුරු
      or exists (select 1 from unnest(regexp_split_to_array(lower(coalesce(p_name, '')), '[^a-z]+')) w
                 where w <> '' and w = any(public.sl_name_words()))
$$;

-- ═══════════ STEP 1 — බලන්න (මුලින්ම මේක විතරක් run කරන්න) ═══════════
-- හංගන්න යන ගිණුම් (Browse එකේ දැනට පේන, ලාංකික නොවන නම්):
select p.id, p.full_name, p.gender,
       (select count(*) from auth.users u where u.id = p.id) = 0 as sample_profile  -- true = login නැති sample ගිණුමක්
from public.profiles p
where p.is_published = true and not public.is_sl_name(p.full_name)
order by p.full_name;

-- ═══════════ STEP 2 — හංගන්න (STEP 1 list එක හරි නම් විතරක්, පහළ පේළි දෙකේ "--" අයින් කරලා run කරන්න) ═══════════
-- update public.profiles set is_published = false
--  where is_published = true and not public.is_sl_name(full_name);

-- ═══════════ UNDO — වැරදීමකින් හංගපු කෙනෙක් ආපහු පෙන්නන්න (id එක දාලා) ═══════════
-- update public.profiles set is_published = true where id = 'මෙතන-id-එක';
