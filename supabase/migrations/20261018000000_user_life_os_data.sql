create table if not exists public.user_life_os_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_life_os_data enable row level security;

revoke all on table public.user_life_os_data from anon;
grant select, insert, update, delete on table public.user_life_os_data to authenticated;

drop policy if exists "Users can read their own Life OS data" on public.user_life_os_data;
create policy "Users can read their own Life OS data"
  on public.user_life_os_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Life OS data" on public.user_life_os_data;
create policy "Users can create their own Life OS data"
  on public.user_life_os_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Life OS data" on public.user_life_os_data;
create policy "Users can update their own Life OS data"
  on public.user_life_os_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own Life OS data" on public.user_life_os_data;
create policy "Users can delete their own Life OS data"
  on public.user_life_os_data for delete to authenticated
  using ((select auth.uid()) = user_id);
