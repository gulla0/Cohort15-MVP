create or replace function public.cohort15_lofi_accept_interest(
  p_cohort_id uuid,
  p_interest_id uuid,
  p_email text,
  p_now timestamptz
)
returns table (
  interest_id uuid,
  interest_created_at timestamptz,
  interest_count bigint,
  reached_quorum boolean,
  conflict_code text,
  quorum_met_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort public.cohort15_lofi_cohorts%rowtype;
  v_interest_count bigint;
  v_quorum_met_at timestamptz;
  v_email text := lower(btrim(p_email));
begin
  select cohorts.*
  into v_cohort
  from public.cohort15_lofi_cohorts as cohorts
  where cohorts.id = p_cohort_id
  for update;

  if not found then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'not_found', null::timestamptz;
    return;
  end if;

  if v_email = v_cohort.creator_email then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'creator_email', v_cohort.quorum_met_at;
    return;
  end if;

  if v_cohort.quorum_met_at is not null then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'already_met', v_cohort.quorum_met_at;
    return;
  end if;

  if p_now >= v_cohort.expires_at then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'expired', v_cohort.quorum_met_at;
    return;
  end if;

  if exists (
    select 1
    from public.cohort15_lofi_interests as interests
    where interests.cohort_id = p_cohort_id and interests.email = v_email
  ) then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'duplicate_email', v_cohort.quorum_met_at;
    return;
  end if;

  insert into public.cohort15_lofi_interests (id, cohort_id, email, created_at)
  values (p_interest_id, p_cohort_id, v_email, p_now);

  select count(*)
  into v_interest_count
  from public.cohort15_lofi_interests as interests
  where interests.cohort_id = p_cohort_id;

  update public.cohort15_lofi_cohorts as cohorts
  set quorum_met_at = p_now,
      updated_at = p_now
  where cohorts.id = p_cohort_id
    and cohorts.quorum_met_at is null
    and v_interest_count >= cohorts.min_quorum
  returning cohorts.quorum_met_at into v_quorum_met_at;

  if v_quorum_met_at is null then
    select cohorts.quorum_met_at
    into v_quorum_met_at
    from public.cohort15_lofi_cohorts as cohorts
    where cohorts.id = p_cohort_id;
  end if;

  return query
  select p_interest_id, p_now, v_interest_count, v_quorum_met_at = p_now, null::text, v_quorum_met_at;
end;
$$;

revoke all on function public.cohort15_lofi_accept_interest(uuid, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.cohort15_lofi_accept_interest(uuid, uuid, text, timestamptz) to service_role;
