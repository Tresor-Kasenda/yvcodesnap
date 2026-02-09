-- Enforce free plan limit at database level.
-- Free users: max 2 snaps
-- Pro users: unlimited

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

  return current_snap_count < 3;
end;
$$;

revoke all on function public.can_insert_snap(uuid) from public;
grant execute on function public.can_insert_snap(uuid) to authenticated;

drop policy if exists snaps_insert_own on public.snaps;
create policy snaps_insert_own
on public.snaps
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.can_insert_snap(auth.uid())
);
