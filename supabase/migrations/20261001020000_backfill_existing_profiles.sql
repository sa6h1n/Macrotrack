-- Backfill profiles for accounts that were created before the MacroTrack schema migration.
-- The auth trigger handles new accounts, while this covers existing users safely.
insert into public.profiles (user_id, name, email)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'name', ''), 'Member'),
  coalesce(u.email, '')
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;
