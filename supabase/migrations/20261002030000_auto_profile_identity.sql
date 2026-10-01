create or replace function public.generate_macrotrack_member_id()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'MTX-';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;

  return result;
end;
$$;

create or replace function public.set_profile_identity()
returns trigger
language plpgsql
as $$
begin
  if new.member_id is null or new.member_id = '' then
    loop
      new.member_id := public.generate_macrotrack_member_id();

      exit when not exists (
        select 1
        from public.profiles
        where member_id = new.member_id
      );
    end loop;
  end if;

  if new.avatar is null or new.avatar = '' then
    if random() < 0.5 then
      new.avatar := '🐐';
    else
      new.avatar := '⚡';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_profile_identity on public.profiles;

create trigger set_profile_identity
before insert on public.profiles
for each row
execute function public.set_profile_identity();