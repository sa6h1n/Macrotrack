-- MacroTrack: per-user food favorites
create table if not exists public.food_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.food_favorites enable row level security;

drop policy if exists "own food favorites" on public.food_favorites;
create policy "own food favorites"
on public.food_favorites
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists food_favorites_food_idx
on public.food_favorites(food_id);
