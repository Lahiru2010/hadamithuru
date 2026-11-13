-- පරිවර්තනයක් නැති values හොයාගන්න query එක
-- Supabase → SQL Editor එකේ run කරන්න. මෙතන එන values ටික option_translations table එකට එකතු කරන්න.
with vals as (
  select 'gender' as field, gender as value from public.profiles
  union select 'religion', religion from public.profiles
  union select 'caste', caste from public.profiles
  union select 'mother_tongue', mother_tongue from public.profiles
  union select 'civil_status', civil_status from public.profiles
  union select 'education', education from public.profiles
  union select 'job_title', job_title from public.profiles
  union select 'income', income from public.profiles
  union select 'father_job', father_job from public.profiles
  union select 'mother_job', mother_job from public.profiles
  union select 'account_created_by', account_created_by from public.profiles
  union select 'food_preference', food_preference from public.profiles
  union select 'drinking', drinking from public.profiles
  union select 'smoking', smoking from public.profiles
  union select 'differently_abled', differently_abled from public.profiles
  union select 'horoscope', horoscope from public.profiles
  union select 'city', city from public.profiles
  union select 'country', country from public.profiles
  union select 'hobby', trim(h) from public.profiles, unnest(string_to_array(hobbies, ',')) as h
)
select field, value
from vals
where value is not null and trim(value) <> ''
  and lower(trim(value)) not in (select lower(trim(value)) from public.option_translations)
order by field, value;
