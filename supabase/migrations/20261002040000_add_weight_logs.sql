create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null check (weight_kg > 0 and weight_kg <= 500),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_user_date_idx
on public.weight_logs (user_id, logged_at desc);

alter table public.weight_logs enable row level security;

drop policy if exists "Users can view their own weight logs"
on public.weight_logs;

create policy "Users can view their own weight logs"
on public.weight_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own weight logs"
on public.weight_logs;

create policy "Users can insert their own weight logs"
on public.weight_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own weight logs"
on public.weight_logs;

create policy "Users can update their own weight logs"
on public.weight_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own weight logs"
on public.weight_logs;

create policy "Users can delete their own weight logs"
on public.weight_logs
for delete
using (auth.uid() = user_id);