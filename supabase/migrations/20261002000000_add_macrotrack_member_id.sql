alter table public.profiles
add column if not exists member_id text;

create unique index if not exists profiles_member_id_unique
on public.profiles (member_id)
where member_id is not null;