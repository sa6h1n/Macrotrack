-- Fix the public/link group join RPC.
-- The previous version used group_id in a way that could become
-- ambiguous with the RETURNS TABLE output column.

create or replace function public.join_group_by_link(join_token_input text)
returns table(result_group_id uuid, result_group_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a group';
  end if;

  select g.*
  into target_group
  from public.groups g
  where g.join_mode = 'link'
    and g.join_token = trim(join_token_input)
  limit 1;

  if not found then
    raise exception 'This group link is invalid or no longer active';
  end if;

  insert into public.group_members(group_id, user_id, role)
  values (target_group.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return query
  select target_group.id, target_group.name;
end;
$$;

grant execute on function public.join_group_by_link(text) to authenticated;
