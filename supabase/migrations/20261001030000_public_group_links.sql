-- Shareable-link groups. The link is a random capability token; knowing it is
-- required to discover/join a link-enabled group. Member nutrition data is
-- still protected by group_progress and each profile's share_* settings.

alter table public.groups
  add column if not exists join_mode text not null default 'invite_only'
    check (join_mode in ('invite_only', 'link'));

alter table public.groups
  add column if not exists join_token text not null default encode(gen_random_bytes(18), 'hex');

create unique index if not exists groups_join_token_idx on public.groups(join_token);

-- Existing groups receive a token automatically; invite-only groups do not
-- expose it through the public join function until their mode is link.

create or replace function public.get_public_group_by_token(join_token_input text)
returns table(id uuid, name text, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, count(gm.id)::bigint
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  where g.join_mode = 'link'
    and g.join_token = trim(join_token_input)
  group by g.id, g.name;
$$;

grant execute on function public.get_public_group_by_token(text) to anon, authenticated;

create or replace function public.join_group_by_link(join_token_input text)
returns table(group_id uuid, group_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.groups;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a group';
  end if;

  select * into target
  from public.groups
  where join_mode = 'link'
    and join_token = trim(join_token_input)
  limit 1;

  if not found then
    raise exception 'This group link is invalid or no longer active';
  end if;

  insert into public.group_members(group_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return query select target.id, target.name;
end;
$$;

grant execute on function public.join_group_by_link(text) to authenticated;

create or replace function public.regenerate_group_join_token(target_group uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  if not public.is_group_owner(target_group) then
    raise exception 'Only the group owner can regenerate the join link';
  end if;

  new_token := encode(gen_random_bytes(18), 'hex');
  update public.groups
  set join_token = new_token
  where id = target_group;

  return new_token;
end;
$$;

grant execute on function public.regenerate_group_join_token(uuid) to authenticated;
