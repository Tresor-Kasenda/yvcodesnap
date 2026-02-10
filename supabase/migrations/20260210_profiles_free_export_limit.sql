-- Enforce free plan image export limit at database level.

alter table public.profiles
add column if not exists free_exports_used integer not null default 0
check (free_exports_used >= 0);

create or replace function public.consume_free_export_slot()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_tier text := 'free';
  current_used integer := 0;
  free_limit integer := 4;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(subscription_tier, 'free'), coalesce(free_exports_used, 0)
  into current_tier, current_used
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    insert into public.profiles (id, subscription_tier, free_exports_used)
    values (current_user_id, 'free', 0)
    on conflict (id) do nothing;

    select coalesce(subscription_tier, 'free'), coalesce(free_exports_used, 0)
    into current_tier, current_used
    from public.profiles
    where id = current_user_id
    for update;
  end if;

  if current_tier = 'pro' then
    return jsonb_build_object(
      'allowed', true,
      'used', current_used,
      'limit', -1,
      'remaining', -1
    );
  end if;

  if current_used >= free_limit then
    return jsonb_build_object(
      'allowed', false,
      'used', current_used,
      'limit', free_limit,
      'remaining', 0
    );
  end if;

  update public.profiles
  set free_exports_used = current_used + 1
  where id = current_user_id
  returning free_exports_used into current_used;

  return jsonb_build_object(
    'allowed', true,
    'used', current_used,
    'limit', free_limit,
    'remaining', greatest(0, free_limit - current_used)
  );
end;
$$;

grant execute on function public.consume_free_export_slot() to authenticated;
