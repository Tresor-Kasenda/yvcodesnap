-- Fix free plan snap limit to 2 at database level.
-- Previous function allowed up to 3 snaps for free users.

create or replace function public.can_insert_snap(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_tier text := 'free';
  current_snap_count integer := 0;
begin
  if p_user_id is null then
    return false;
  end if;

  if to_regclass('public.profiles') is not null then
    select coalesce(subscription_tier, 'free')
      into user_tier
    from public.profiles
    where id = p_user_id;

    user_tier := coalesce(user_tier, 'free');
  end if;

  if user_tier = 'pro' then
    return true;
  end if;

  select count(*)
    into current_snap_count
  from public.snaps
  where user_id = p_user_id;

  return current_snap_count < 2;
end;
$$;
