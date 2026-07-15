create function public.cohort15_lofi_create_funded_cohort(
  p_cohort_id uuid, p_hold_id uuid, p_user_id uuid, p_email text,
  p_title text, p_description text, p_category text, p_topic text,
  p_target_audience text, p_target_skill_level text, p_additional_details text,
  p_min_quorum integer, p_meeting_link text, p_creator_time_zone text,
  p_first_meeting_at timestamptz, p_first_meeting_local text,
  p_meeting_duration_minutes integer, p_recurrence text, p_meeting_count integer,
  p_expires_at timestamptz, p_now timestamptz
)
returns table (cohort_id uuid, hold_transaction_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.cohort15_lofi_users%rowtype;
  v_available bigint;
begin
  select users.* into v_user from public.cohort15_lofi_users as users
  where users.id = p_user_id for update;
  if v_user.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_user.email <> lower(btrim(p_email)) then raise exception 'identity_conflict' using errcode = '23514'; end if;

  select balances.available into v_available
  from public.cohort15_lofi_credit_balance(p_user_id) as balances;
  if v_available < 2 then raise exception 'insufficient_credits' using errcode = 'P0001'; end if;

  insert into public.cohort15_lofi_cohorts (
    id, creator_email, creator_user_id, title, description, category, topic,
    target_audience, target_skill_level, additional_details, min_quorum, meeting_link,
    creator_time_zone, first_meeting_at, first_meeting_local, meeting_duration_minutes,
    recurrence, meeting_count, created_at, updated_at, expires_at, quorum_met_at
  ) values (
    p_cohort_id, v_user.email, v_user.id, p_title, p_description, p_category, p_topic,
    p_target_audience, p_target_skill_level, p_additional_details, p_min_quorum, p_meeting_link,
    p_creator_time_zone, p_first_meeting_at, p_first_meeting_local, p_meeting_duration_minutes,
    p_recurrence, p_meeting_count, p_now, p_now, p_expires_at, null
  );
  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, cohort_id, source, created_at
  ) values (
    p_hold_id, p_user_id, 'hold', 2, 'cohort:' || p_cohort_id::text || ':creator_hold',
    p_cohort_id, 'cohort_creation', p_now
  );
  return query select p_cohort_id, p_hold_id;
end;
$$;

create function public.cohort15_lofi_accept_funded_interest(
  p_cohort_id uuid, p_interest_id uuid, p_hold_id uuid,
  p_user_id uuid, p_email text, p_now timestamptz
)
returns table (interest_id uuid, interest_count bigint, reached_quorum boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cohort public.cohort15_lofi_cohorts%rowtype;
  v_user public.cohort15_lofi_users%rowtype;
  v_count bigint;
  v_available bigint;
  v_reached boolean := false;
begin
  select cohorts.* into v_cohort from public.cohort15_lofi_cohorts as cohorts
  where cohorts.id = p_cohort_id for update;
  if v_cohort.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  select users.* into v_user from public.cohort15_lofi_users as users
  where users.id = p_user_id for update;
  if v_user.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_user.email <> lower(btrim(p_email)) then raise exception 'identity_conflict' using errcode = '23514'; end if;
  if v_cohort.creator_user_id = p_user_id or v_cohort.creator_email = v_user.email then
    raise exception 'creator_user' using errcode = '23505';
  end if;
  if v_cohort.quorum_met_at is not null then raise exception 'already_met' using errcode = '23505'; end if;
  if p_now >= v_cohort.expires_at then raise exception 'expired' using errcode = '23505'; end if;
  if exists (select 1 from public.cohort15_lofi_interests as interests
    where interests.cohort_id = p_cohort_id and interests.user_id = p_user_id) then
    raise exception 'duplicate_user' using errcode = '23505';
  end if;
  if exists (select 1 from public.cohort15_lofi_interests as interests
    where interests.cohort_id = p_cohort_id and interests.email = v_user.email) then
    raise exception 'duplicate_email' using errcode = '23505';
  end if;
  select balances.available into v_available
  from public.cohort15_lofi_credit_balance(p_user_id) as balances;
  if v_available < 1 then raise exception 'insufficient_credits' using errcode = 'P0001'; end if;

  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, cohort_id, source, created_at
  ) values (
    p_hold_id, p_user_id, 'hold', 1,
    'cohort:' || p_cohort_id::text || ':interest:' || p_user_id::text,
    p_cohort_id, 'cohort_interest', p_now
  );
  insert into public.cohort15_lofi_interests (id, cohort_id, email, user_id, created_at)
  values (p_interest_id, p_cohort_id, v_user.email, p_user_id, p_now);
  select count(*) into v_count from public.cohort15_lofi_interests as interests
  where interests.cohort_id = p_cohort_id;

  if v_count >= v_cohort.min_quorum then
    update public.cohort15_lofi_cohorts set quorum_met_at = p_now, updated_at = p_now
    where id = p_cohort_id and quorum_met_at is null;
    v_reached := found;
    if v_reached then
      insert into public.cohort15_lofi_credit_transactions (
        id, user_id, type, amount, idempotency_key, cohort_id, source,
        source_transaction_id, created_at
      )
      select gen_random_uuid(), holds.user_id, 'consume', holds.amount,
        'consume:' || holds.id::text, p_cohort_id, holds.id::text, holds.id, p_now
      from public.cohort15_lofi_credit_transactions as holds
      where holds.cohort_id = p_cohort_id and holds.type = 'hold'
        and holds.source in ('cohort_creation', 'cohort_interest')
        and not exists (
          select 1 from public.cohort15_lofi_credit_transactions as settlements
          where settlements.source_transaction_id = holds.id
        );
    end if;
  end if;
  return query select p_interest_id, v_count, v_reached;
end;
$$;

create function public.cohort15_lofi_settle_expired_holds(p_user_id uuid, p_now timestamptz)
returns table (refunded_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count bigint;
begin
  perform 1 from public.cohort15_lofi_users as users where users.id = p_user_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  with inserted as (
    insert into public.cohort15_lofi_credit_transactions (
      id, user_id, type, amount, idempotency_key, cohort_id, source,
      source_transaction_id, created_at
    )
    select gen_random_uuid(), holds.user_id, 'refund', holds.amount,
      'refund:' || holds.id::text, holds.cohort_id, holds.id::text, holds.id, p_now
    from public.cohort15_lofi_credit_transactions as holds
    join public.cohort15_lofi_cohorts as cohorts on cohorts.id = holds.cohort_id
    where holds.user_id = p_user_id and holds.type = 'hold'
      and holds.source in ('cohort_creation', 'cohort_interest')
      and cohorts.quorum_met_at is null and p_now >= cohorts.expires_at
      and not exists (
        select 1 from public.cohort15_lofi_credit_transactions as settlements
        where settlements.source_transaction_id = holds.id
      )
    on conflict (idempotency_key) do nothing
    returning 1
  ) select count(*) into v_count from inserted;
  return query select v_count;
end;
$$;

revoke all on function public.cohort15_lofi_create_funded_cohort(uuid, uuid, uuid, text, text, text, text, text, text, text, text, integer, text, text, timestamptz, text, integer, text, integer, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.cohort15_lofi_create_funded_cohort(uuid, uuid, uuid, text, text, text, text, text, text, text, text, integer, text, text, timestamptz, text, integer, text, integer, timestamptz, timestamptz) to service_role;
revoke all on function public.cohort15_lofi_accept_funded_interest(uuid, uuid, uuid, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.cohort15_lofi_accept_funded_interest(uuid, uuid, uuid, uuid, text, timestamptz) to service_role;
revoke all on function public.cohort15_lofi_settle_expired_holds(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.cohort15_lofi_settle_expired_holds(uuid, timestamptz) to service_role;
