create or replace function public.create_group(
  group_name text,
  group_join_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'You must be signed in to create a group';
  end if;

  if group_name is null or char_length(trim(group_name)) = 0 then
    raise exception 'Group name is required';
  end if;

  if char_length(trim(group_name)) > 80 then
    raise exception 'Group name must be 80 characters or fewer';
  end if;

  if group_join_mode not in ('invite_only', 'link') then
    raise exception 'Invalid group join mode';
  end if;

  insert into public.groups (
    name,
    created_by,
    join_mode
  )
  values (
    trim(group_name),
    current_user_id,
    group_join_mode
  )
  returning id into new_group_id;

  return new_group_id;
end;
$$;

revoke all on function public.create_group(text, text)
from public;

grant execute on function public.create_group(text, text)
to authenticated;