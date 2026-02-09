-- Snaps storage table for cloud projects
-- Fixes: "Could not find the table 'public.snaps' in the schema cache"

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.snaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  data jsonb not null,
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_snaps_user_id on public.snaps(user_id);
create index if not exists idx_snaps_user_created_at on public.snaps(user_id, created_at desc);
create index if not exists idx_snaps_is_public on public.snaps(is_public);

drop trigger if exists trg_snaps_updated_at on public.snaps;
create trigger trg_snaps_updated_at
before update on public.snaps
for each row execute function public.set_updated_at();

alter table public.snaps enable row level security;

drop policy if exists snaps_select_own on public.snaps;
create policy snaps_select_own
on public.snaps
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists snaps_insert_own on public.snaps;
create policy snaps_insert_own
on public.snaps
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists snaps_update_own on public.snaps;
create policy snaps_update_own
on public.snaps
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists snaps_delete_own on public.snaps;
create policy snaps_delete_own
on public.snaps
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.snaps to authenticated;
