create table public.cohort15_lofi_cohorts (
  id uuid primary key,
  creator_email text not null check (creator_email = lower(btrim(creator_email))),
  title text not null,
  description text not null,
  category text not null,
  topic text not null,
  target_audience text not null,
  target_skill_level text not null,
  additional_details text,
  min_quorum integer not null,
  meeting_link text not null,
  creator_time_zone text not null,
  first_meeting_at timestamptz not null,
  first_meeting_local text not null,
  meeting_duration_minutes integer not null,
  recurrence text not null,
  meeting_count integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  expires_at timestamptz not null,
  quorum_met_at timestamptz
);

create table public.cohort15_lofi_interests (
  id uuid primary key,
  cohort_id uuid not null references public.cohort15_lofi_cohorts (id) on delete cascade,
  email text not null check (email = lower(btrim(email))),
  created_at timestamptz not null,
  unique (cohort_id, email)
);

create table public.cohort15_lofi_notification_deliveries (
  id uuid primary key,
  idempotency_key text not null unique,
  cohort_id uuid not null references public.cohort15_lofi_cohorts (id) on delete cascade,
  interest_id uuid references public.cohort15_lofi_interests (id) on delete set null,
  recipient_email text not null check (recipient_email = lower(btrim(recipient_email))),
  type text not null,
  status text not null,
  attempt_count integer not null default 0,
  provider_error_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  sent_at timestamptz
);

alter table public.cohort15_lofi_cohorts enable row level security;
alter table public.cohort15_lofi_interests enable row level security;
alter table public.cohort15_lofi_notification_deliveries enable row level security;

revoke all on table public.cohort15_lofi_cohorts from anon, authenticated;
revoke all on table public.cohort15_lofi_interests from anon, authenticated;
revoke all on table public.cohort15_lofi_notification_deliveries from anon, authenticated;

grant all on table public.cohort15_lofi_cohorts to service_role;
grant all on table public.cohort15_lofi_interests to service_role;
grant all on table public.cohort15_lofi_notification_deliveries to service_role;

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
  select *
  into v_cohort
  from public.cohort15_lofi_cohorts
  where id = p_cohort_id
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
    from public.cohort15_lofi_interests
    where cohort_id = p_cohort_id and email = v_email
  ) then
    return query
    select null::uuid, null::timestamptz, 0::bigint, false, 'duplicate_email', v_cohort.quorum_met_at;
    return;
  end if;

  insert into public.cohort15_lofi_interests (id, cohort_id, email, created_at)
  values (p_interest_id, p_cohort_id, v_email, p_now);

  select count(*)
  into v_interest_count
  from public.cohort15_lofi_interests
  where cohort_id = p_cohort_id;

  update public.cohort15_lofi_cohorts
  set quorum_met_at = p_now,
      updated_at = p_now
  where id = p_cohort_id
    and quorum_met_at is null
    and v_interest_count >= min_quorum
  returning quorum_met_at into v_quorum_met_at;

  if v_quorum_met_at is null then
    select quorum_met_at
    into v_quorum_met_at
    from public.cohort15_lofi_cohorts
    where id = p_cohort_id;
  end if;

  return query
  select p_interest_id, p_now, v_interest_count, v_quorum_met_at = p_now, null::text, v_quorum_met_at;
end;
$$;

revoke all on function public.cohort15_lofi_accept_interest(uuid, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.cohort15_lofi_accept_interest(uuid, uuid, text, timestamptz) to service_role;
