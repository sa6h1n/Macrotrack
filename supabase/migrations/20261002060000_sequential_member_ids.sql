-- Create a sequence for MacroTrack member IDs.
create sequence if not exists public.macrotrack_member_id_seq
start with 1
increment by 1
minvalue 1
no cycle;


-- Move the sequence forward based on existing MTX IDs.
do $$
declare
  max_existing_id bigint;
begin
  select coalesce(
    max(
      substring(member_id from '^MTX-([0-9]+)$')::bigint
    ),
    0
  )
  into max_existing_id
  from public.profiles
  where member_id ~ '^MTX-[0-9]+$';

  if max_existing_id > 0 then
    perform setval(
      'public.macrotrack_member_id_seq',
      max_existing_id,
      true
    );
  end if;
end;
$$;


-- Generate the next sequential MacroTrack ID.
create or replace function public.generate_macrotrack_member_id()
returns text
language plpgsql
as $$
declare
  next_number bigint;
  candidate text;
begin
  loop
    next_number := nextval('public.macrotrack_member_id_seq');

    candidate := 'MTX-' || lpad(next_number::text, 2, '0');

    -- Prevent collisions with manually assigned IDs.
    if not exists (
      select 1
      from public.profiles
      where member_id = candidate
    ) then
      return candidate;
    end if;
  end loop;
end;
$$;