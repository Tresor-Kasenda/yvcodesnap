-- Profiles + onboarding persistence schema
-- Run this in Supabase SQL Editor or via Supabase migrations.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro')),
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  onboarding_use_case text
    check (onboarding_use_case in ('social-content', 'marketing-campaigns', 'education-training', 'internal-communication')),
  onboarding_experience_level text
    check (onboarding_experience_level in ('beginner', 'intermediate', 'advanced')),
  onboarding_primary_format text
    check (onboarding_primary_format in ('social-posts', 'presentations', 'tutorials', 'documents', 'ads', 'mixed')),
  onboarding_plan_intent text
    check (onboarding_plan_intent in ('free', 'pro-trial', 'team')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_onboarding_complete_requires_fields check (
    onboarding_completed = false
    or (
      full_name is not null
      and length(trim(full_name)) >= 2
      and onboarding_completed_at is not null
      and onboarding_use_case is not null
      and onboarding_experience_level is not null
      and onboarding_primary_format is not null
      and onboarding_plan_intent is not null
    )
  )
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  inferred_name text;
begin
  inferred_name := nullif(
    trim(
      coalesce(
        metadata->>'full_name',
        metadata->>'name',
        split_part(coalesce(new.email, ''), '@', 1)
      )
    ),
    ''
  );

  insert into public.profiles (id, full_name)
  values (new.id, inferred_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

with normalized as (
  select
    u.id,
    nullif(
      trim(
        coalesce(
          u.raw_user_meta_data->>'full_name',
          u.raw_user_meta_data->>'name',
          split_part(coalesce(u.email, ''), '@', 1)
        )
      ),
      ''
    ) as full_name,
    coalesce((u.raw_user_meta_data->>'onboarding_completed')::boolean, false) as onboarding_completed_requested,
    case
      when (u.raw_user_meta_data->>'onboarding_completed_at') is null then null
      else (u.raw_user_meta_data->>'onboarding_completed_at')::timestamptz
    end as onboarding_completed_at,
    case
      when (u.raw_user_meta_data->'onboarding_preferences'->>'useCase')
        in ('social-content', 'marketing-campaigns', 'education-training', 'internal-communication')
      then u.raw_user_meta_data->'onboarding_preferences'->>'useCase'
      else null
    end as onboarding_use_case,
    case
      when (u.raw_user_meta_data->'onboarding_preferences'->>'experienceLevel')
        in ('beginner', 'intermediate', 'advanced')
      then u.raw_user_meta_data->'onboarding_preferences'->>'experienceLevel'
      else null
    end as onboarding_experience_level,
    case
      when (u.raw_user_meta_data->'onboarding_preferences'->>'primaryFormat')
        in ('social-posts', 'presentations', 'tutorials', 'documents', 'ads', 'mixed')
      then u.raw_user_meta_data->'onboarding_preferences'->>'primaryFormat'
      else null
    end as onboarding_primary_format,
    case
      when (u.raw_user_meta_data->'onboarding_preferences'->>'planIntent')
        in ('free', 'pro-trial', 'team')
      then u.raw_user_meta_data->'onboarding_preferences'->>'planIntent'
      else null
    end as onboarding_plan_intent
  from auth.users u
)
insert into public.profiles (
  id,
  full_name,
  subscription_tier,
  onboarding_completed,
  onboarding_completed_at,
  onboarding_use_case,
  onboarding_experience_level,
  onboarding_primary_format,
  onboarding_plan_intent
)
select
  n.id,
  n.full_name,
  'free',
  (
    n.onboarding_completed_requested = true
    and n.full_name is not null
    and length(trim(n.full_name)) >= 2
    and n.onboarding_completed_at is not null
    and n.onboarding_use_case is not null
    and n.onboarding_experience_level is not null
    and n.onboarding_primary_format is not null
    and n.onboarding_plan_intent is not null
  ) as onboarding_completed,
  case
    when (
      n.onboarding_completed_requested = true
      and n.full_name is not null
      and length(trim(n.full_name)) >= 2
      and n.onboarding_completed_at is not null
      and n.onboarding_use_case is not null
      and n.onboarding_experience_level is not null
      and n.onboarding_primary_format is not null
      and n.onboarding_plan_intent is not null
    ) then n.onboarding_completed_at
    else null
  end as onboarding_completed_at,
  case
    when (
      n.onboarding_completed_requested = true
      and n.full_name is not null
      and length(trim(n.full_name)) >= 2
      and n.onboarding_completed_at is not null
      and n.onboarding_use_case is not null
      and n.onboarding_experience_level is not null
      and n.onboarding_primary_format is not null
      and n.onboarding_plan_intent is not null
    ) then n.onboarding_use_case
    else null
  end as onboarding_use_case,
  case
    when (
      n.onboarding_completed_requested = true
      and n.full_name is not null
      and length(trim(n.full_name)) >= 2
      and n.onboarding_completed_at is not null
      and n.onboarding_use_case is not null
      and n.onboarding_experience_level is not null
      and n.onboarding_primary_format is not null
      and n.onboarding_plan_intent is not null
    ) then n.onboarding_experience_level
    else null
  end as onboarding_experience_level,
  case
    when (
      n.onboarding_completed_requested = true
      and n.full_name is not null
      and length(trim(n.full_name)) >= 2
      and n.onboarding_completed_at is not null
      and n.onboarding_use_case is not null
      and n.onboarding_experience_level is not null
      and n.onboarding_primary_format is not null
      and n.onboarding_plan_intent is not null
    ) then n.onboarding_primary_format
    else null
  end as onboarding_primary_format,
  case
    when (
      n.onboarding_completed_requested = true
      and n.full_name is not null
      and length(trim(n.full_name)) >= 2
      and n.onboarding_completed_at is not null
      and n.onboarding_use_case is not null
      and n.onboarding_experience_level is not null
      and n.onboarding_primary_format is not null
      and n.onboarding_plan_intent is not null
    ) then n.onboarding_plan_intent
    else null
  end as onboarding_plan_intent
from normalized n
on conflict (id) do update
set
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  onboarding_completed = public.profiles.onboarding_completed or excluded.onboarding_completed,
  onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, excluded.onboarding_completed_at),
  onboarding_use_case = coalesce(public.profiles.onboarding_use_case, excluded.onboarding_use_case),
  onboarding_experience_level = coalesce(public.profiles.onboarding_experience_level, excluded.onboarding_experience_level),
  onboarding_primary_format = coalesce(public.profiles.onboarding_primary_format, excluded.onboarding_primary_format),
  onboarding_plan_intent = coalesce(public.profiles.onboarding_plan_intent, excluded.onboarding_plan_intent),
  updated_at = timezone('utc', now());

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select, insert, update on table public.profiles to authenticated;
