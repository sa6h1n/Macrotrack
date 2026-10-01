alter table public.profiles
add column if not exists avatar text;

alter table public.profiles
add constraint profiles_avatar_check
check (avatar in ('🐐', '⚡') or avatar is null);