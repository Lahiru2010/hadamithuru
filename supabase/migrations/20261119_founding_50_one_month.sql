-- 20261119_founding_50_one_month.sql
-- 🎁 Founding offer එක වෙනස් කරනවා:
--   • පළමු verified සාමාජිකයින් 50ට විතරයි: 👑 Founding Member + Premium මාසයක් නොමිලේ
--   • 50න් පස්සේ verify වෙන අයට තෑග්ගක් නෑ (verify එක නොමිලේමයි, ලකුණත් ලැබෙනවා)
-- ⚠️ 20261118_founding_rewards.sql එක කලින් run කරලා තියෙන්න ඕනේ. කීප පාරක් run කළත් කමක් නෑ.
-- ⚠️ අගයන් වෙනස් කරනවා නම්: මෙතන + lib/offer.ts එකේ දෙකේම.

-- 1) Founding සීමාව 500 → 50
create or replace function public.founding_limit() returns integer language sql immutable as $$ select 50 $$;

-- 2) තෑග්ග දෙන function එක (Founding = මාස 1, ඊට පස්සේ = 0 → කිසිවක් නෑ)
create or replace function public.grant_verification_rewards(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_founding_months constant integer := 1;  -- 👈 Founding අයට Premium මාස
  v_verify_months   constant integer := 0;  -- 👈 50න් පස්සේ verify වෙන අයට (0 = නෑ)
  v_count integer;
  v_num integer;
  v_months integer;
  v_reason text;
  v_until timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('seneha_founding_rewards'));

  if exists (select 1 from public.premium_grants where user_id = p_user and reason in ('founding', 'verify_reward')) then
    return jsonb_build_object('granted', false);
  end if;

  select count(*) into v_count from public.profiles where founding_member;
  if v_count < public.founding_limit() then
    v_num := coalesce((select max(founding_number) from public.profiles), 0) + 1;
    v_reason := 'founding';
    v_months := v_founding_months;
    update public.profiles set founding_member = true, founding_number = v_num where id = p_user;
  elsif v_verify_months > 0 then
    v_reason := 'verify_reward';
    v_months := v_verify_months;
  else
    return jsonb_build_object('granted', false); -- 👈 Founding ස්ථාන ඉවරයි, වෙන තෑග්ගක් නෑ
  end if;

  insert into public.premium_grants (user_id, reason, months) values (p_user, v_reason, v_months);
  update public.profiles
    set premium_until = greatest(coalesce(premium_until, now()), now()) + make_interval(months => v_months)
    where id = p_user
    returning premium_until into v_until;

  return jsonb_build_object('granted', true, 'reason', v_reason, 'months', v_months, 'number', v_num, 'premium_until', v_until);
end;
$$;
revoke execute on function public.grant_verification_rewards(uuid) from public, anon, authenticated;
grant execute on function public.grant_verification_rewards(uuid) to service_role;

-- 3) (කැමති නම් විතරයි) කලින් update එකෙන් දැනටමත් මාස 3 ලැබුණ Founding අයව මාස 1ට අඩු කරන්න.
--    පහළ lines දෙක comment එකෙන් අයින් කරලා run කරන්න:
-- update public.profiles p set premium_until = p.premium_until - interval '2 months'
--   from public.premium_grants g where g.user_id = p.id and g.reason = 'founding' and g.months = 3;
-- update public.premium_grants set months = 1 where reason = 'founding' and months = 3;

-- 🔍 පරීක්ෂා කරන්න (50 - දැනට ඉන්න Founding ගණන):
-- select public.founding_spots_left();
