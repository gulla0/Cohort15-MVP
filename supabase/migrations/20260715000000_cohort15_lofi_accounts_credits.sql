alter table public.cohort15_lofi_cohorts
  add column creator_user_id uuid;

alter table public.cohort15_lofi_interests
  add column user_id uuid;

create table public.cohort15_lofi_users (
  id uuid primary key,
  supabase_subject text not null unique check (supabase_subject = btrim(supabase_subject) and supabase_subject <> ''),
  email text not null unique check (email = lower(btrim(email)) and email <> ''),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.cohort15_lofi_cohorts
  add constraint cohort15_lofi_cohorts_creator_user_id_fkey
  foreign key (creator_user_id) references public.cohort15_lofi_users (id) on delete set null;

alter table public.cohort15_lofi_interests
  add constraint cohort15_lofi_interests_user_id_fkey
  foreign key (user_id) references public.cohort15_lofi_users (id) on delete set null;

create unique index cohort15_lofi_interests_cohort_user_id_key
  on public.cohort15_lofi_interests (cohort_id, user_id)
  where user_id is not null;

create table public.cohort15_lofi_sessions (
  id uuid primary key,
  user_id uuid not null references public.cohort15_lofi_users (id) on delete cascade,
  token_digest text not null unique check (token_digest ~ '^[0-9a-f]{64}$'),
  csrf_digest text not null check (csrf_digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (expires_at > created_at)
);

create table public.cohort15_lofi_purchases (
  id uuid primary key,
  user_id uuid not null references public.cohort15_lofi_users (id),
  package_id text not null check (package_id = btrim(package_id) and package_id <> ''),
  credits integer not null check (credits > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null check (currency = lower(btrim(currency)) and currency <> ''),
  status text not null check (status in ('pending', 'fulfilled', 'failed', 'cancelled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  credit_transaction_id uuid unique,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  fulfilled_at timestamptz,
  check ((status = 'fulfilled') = (fulfilled_at is not null)),
  check ((status = 'fulfilled') = (credit_transaction_id is not null))
);

create table public.cohort15_lofi_credit_transactions (
  id uuid primary key,
  user_id uuid not null references public.cohort15_lofi_users (id),
  type text not null check (type in ('grant', 'purchase', 'hold', 'consume', 'refund')),
  amount integer not null check (amount > 0),
  idempotency_key text not null unique check (idempotency_key = btrim(idempotency_key) and idempotency_key <> ''),
  cohort_id uuid references public.cohort15_lofi_cohorts (id),
  purchase_id uuid unique references public.cohort15_lofi_purchases (id),
  source text,
  source_transaction_id uuid unique references public.cohort15_lofi_credit_transactions (id),
  created_at timestamptz not null,
  check (
    (type in ('grant', 'purchase', 'hold') and source_transaction_id is null)
    or (type in ('consume', 'refund') and source_transaction_id is not null)
  ),
  check ((type = 'purchase') = (purchase_id is not null))
);

alter table public.cohort15_lofi_purchases
  add constraint cohort15_lofi_purchases_credit_transaction_id_fkey
  foreign key (credit_transaction_id) references public.cohort15_lofi_credit_transactions (id);

create table public.cohort15_lofi_stripe_events (
  event_id text primary key check (event_id = btrim(event_id) and event_id <> ''),
  event_type text not null check (event_type = btrim(event_type) and event_type <> ''),
  outcome text not null check (outcome = btrim(outcome) and outcome <> ''),
  created_at timestamptz not null
);

alter table public.cohort15_lofi_users enable row level security;
alter table public.cohort15_lofi_sessions enable row level security;
alter table public.cohort15_lofi_credit_transactions enable row level security;
alter table public.cohort15_lofi_purchases enable row level security;
alter table public.cohort15_lofi_stripe_events enable row level security;

revoke all on table public.cohort15_lofi_users from public, anon, authenticated;
revoke all on table public.cohort15_lofi_sessions from public, anon, authenticated;
revoke all on table public.cohort15_lofi_credit_transactions from public, anon, authenticated;
revoke all on table public.cohort15_lofi_purchases from public, anon, authenticated;
revoke all on table public.cohort15_lofi_stripe_events from public, anon, authenticated;

grant select on table public.cohort15_lofi_users to service_role;
grant select, insert, update, delete on table public.cohort15_lofi_sessions to service_role;
grant select on table public.cohort15_lofi_credit_transactions to service_role;
grant select, insert, update on table public.cohort15_lofi_purchases to service_role;
grant select, insert on table public.cohort15_lofi_stripe_events to service_role;

create function public.cohort15_lofi_reject_credit_transaction_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'immutable_credit_transaction' using errcode = '23514';
end;
$$;

create trigger cohort15_lofi_credit_transactions_immutable
before update or delete on public.cohort15_lofi_credit_transactions
for each row execute function public.cohort15_lofi_reject_credit_transaction_mutation();

create function public.cohort15_lofi_credit_balance(p_user_id uuid)
returns table (
  funded bigint,
  available bigint,
  held bigint,
  consumed bigint,
  refunded bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(sum(t.amount) filter (where t.type in ('grant', 'purchase')), 0)::bigint as funded,
    (
      coalesce(sum(t.amount) filter (where t.type in ('grant', 'purchase')), 0)
      - coalesce(sum(t.amount) filter (where t.type = 'hold'), 0)
      + coalesce(sum(t.amount) filter (where t.type = 'refund'), 0)
    )::bigint as available,
    (
      coalesce(sum(t.amount) filter (where t.type = 'hold'), 0)
      - coalesce(sum(t.amount) filter (where t.type in ('consume', 'refund')), 0)
    )::bigint as held,
    coalesce(sum(t.amount) filter (where t.type = 'consume'), 0)::bigint as consumed,
    coalesce(sum(t.amount) filter (where t.type = 'refund'), 0)::bigint as refunded
  from public.cohort15_lofi_credit_transactions as t
  where t.user_id = p_user_id;
$$;

create function public.cohort15_lofi_provision_user(
  p_user_id uuid,
  p_grant_transaction_id uuid,
  p_supabase_subject text,
  p_email text,
  p_now timestamptz
)
returns table (
  user_id uuid,
  normalized_email text,
  supabase_subject text,
  user_created boolean,
  grant_transaction_id uuid,
  grant_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(p_email));
  v_subject text := btrim(p_supabase_subject);
  v_subject_user public.cohort15_lofi_users%rowtype;
  v_email_user public.cohort15_lofi_users%rowtype;
  v_user public.cohort15_lofi_users%rowtype;
  v_grant public.cohort15_lofi_credit_transactions%rowtype;
  v_user_created boolean := false;
  v_grant_created boolean := false;
begin
  if v_email is null or v_email = '' or v_subject is null or v_subject = '' then
    raise exception 'identity_conflict' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cohort15_lofi_email:' || v_email, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cohort15_lofi_subject:' || v_subject, 0));

  select users.* into v_subject_user
  from public.cohort15_lofi_users as users
  where users.supabase_subject = v_subject
  for update;

  select users.* into v_email_user
  from public.cohort15_lofi_users as users
  where users.email = v_email
  for update;

  if (v_subject_user.id is not null and v_subject_user.email <> v_email)
    or (v_email_user.id is not null and v_email_user.supabase_subject <> v_subject)
    or (v_subject_user.id is not null and v_email_user.id is not null and v_subject_user.id <> v_email_user.id) then
    raise exception 'identity_conflict' using errcode = '23505';
  end if;

  if v_subject_user.id is not null then
    v_user := v_subject_user;
  elsif v_email_user.id is not null then
    v_user := v_email_user;
  else
    insert into public.cohort15_lofi_users (id, supabase_subject, email, created_at, updated_at)
    values (p_user_id, v_subject, v_email, p_now, p_now)
    returning * into v_user;
    v_user_created := true;
  end if;

  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, source, created_at
  ) values (
    p_grant_transaction_id, v_user.id, 'grant', 2, 'signup_grant:' || v_user.id::text, 'signup_grant', p_now
  )
  on conflict (idempotency_key) do nothing
  returning * into v_grant;

  if v_grant.id is not null then
    v_grant_created := true;
  else
    select transactions.* into v_grant
    from public.cohort15_lofi_credit_transactions as transactions
    where transactions.idempotency_key = 'signup_grant:' || v_user.id::text;
    if v_grant.user_id <> v_user.id or v_grant.type <> 'grant' or v_grant.amount <> 2 then
      raise exception 'duplicate_credit_transaction' using errcode = '23505';
    end if;
  end if;

  return query select v_user.id, v_user.email, v_user.supabase_subject,
    v_user_created, v_grant.id, v_grant_created;
end;
$$;

create function public.cohort15_lofi_hold_credits(
  p_transaction_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_idempotency_key text,
  p_cohort_id uuid,
  p_source text,
  p_now timestamptz
)
returns table (transaction_id uuid, created boolean, available bigint, held bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.cohort15_lofi_credit_transactions%rowtype;
  v_available bigint;
  v_held bigint;
begin
  perform 1 from public.cohort15_lofi_users as users where users.id = p_user_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if p_amount is null or p_amount <= 0 or btrim(p_idempotency_key) = '' then
    raise exception 'duplicate_credit_transaction' using errcode = '23514';
  end if;

  select transactions.* into v_existing
  from public.cohort15_lofi_credit_transactions as transactions
  where transactions.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.user_id <> p_user_id or v_existing.type <> 'hold' or v_existing.amount <> p_amount then
      raise exception 'idempotency_mismatch' using errcode = '23505';
    end if;
    select balances.available, balances.held into v_available, v_held
    from public.cohort15_lofi_credit_balance(p_user_id) as balances;
    return query select v_existing.id, false, v_available, v_held;
    return;
  end if;

  select balances.available, balances.held into v_available, v_held
  from public.cohort15_lofi_credit_balance(p_user_id) as balances;
  if v_available < p_amount then raise exception 'insufficient_credits' using errcode = 'P0001'; end if;

  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, cohort_id, source, created_at
  ) values (
    p_transaction_id, p_user_id, 'hold', p_amount, p_idempotency_key, p_cohort_id, p_source, p_now
  );

  select balances.available, balances.held into v_available, v_held
  from public.cohort15_lofi_credit_balance(p_user_id) as balances;
  if v_available < 0 or v_held < 0 then raise exception 'insufficient_credits' using errcode = '23514'; end if;
  return query select p_transaction_id, true, v_available, v_held;
end;
$$;

create function public.cohort15_lofi_settle_credit_hold(
  p_transaction_id uuid,
  p_user_id uuid,
  p_hold_transaction_id uuid,
  p_type text,
  p_idempotency_key text,
  p_cohort_id uuid,
  p_now timestamptz
)
returns table (transaction_id uuid, created boolean, available bigint, held bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hold public.cohort15_lofi_credit_transactions%rowtype;
  v_existing public.cohort15_lofi_credit_transactions%rowtype;
  v_available bigint;
  v_held bigint;
begin
  if p_type not in ('consume', 'refund') then raise exception 'invalid_hold' using errcode = '23514'; end if;
  perform 1 from public.cohort15_lofi_users as users where users.id = p_user_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;

  select transactions.* into v_existing
  from public.cohort15_lofi_credit_transactions as transactions
  where transactions.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.user_id <> p_user_id or v_existing.type <> p_type
      or v_existing.source_transaction_id <> p_hold_transaction_id then
      raise exception 'idempotency_mismatch' using errcode = '23505';
    end if;
    select balances.available, balances.held into v_available, v_held
    from public.cohort15_lofi_credit_balance(p_user_id) as balances;
    return query select v_existing.id, false, v_available, v_held;
    return;
  end if;

  select transactions.* into v_hold
  from public.cohort15_lofi_credit_transactions as transactions
  where transactions.id = p_hold_transaction_id
  for update;
  if v_hold.id is null or v_hold.type <> 'hold' or v_hold.user_id <> p_user_id then
    raise exception 'invalid_hold' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.cohort15_lofi_credit_transactions as settlements
    where settlements.source_transaction_id = v_hold.id
  ) then raise exception 'hold_settled' using errcode = '23505'; end if;

  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, cohort_id, source, source_transaction_id, created_at
  ) values (
    p_transaction_id, p_user_id, p_type, v_hold.amount, p_idempotency_key,
    coalesce(p_cohort_id, v_hold.cohort_id), v_hold.id::text, v_hold.id, p_now
  );

  select balances.available, balances.held into v_available, v_held
  from public.cohort15_lofi_credit_balance(p_user_id) as balances;
  if v_available < 0 or v_held < 0 then raise exception 'invalid_hold' using errcode = '23514'; end if;
  return query select p_transaction_id, true, v_available, v_held;
end;
$$;

create function public.cohort15_lofi_consume_credit_hold(
  p_transaction_id uuid, p_user_id uuid, p_hold_transaction_id uuid,
  p_idempotency_key text, p_cohort_id uuid, p_now timestamptz
)
returns table (transaction_id uuid, created boolean, available bigint, held bigint)
language sql
security definer
set search_path = ''
as $$
  select * from public.cohort15_lofi_settle_credit_hold(
    p_transaction_id, p_user_id, p_hold_transaction_id, 'consume', p_idempotency_key, p_cohort_id, p_now
  );
$$;

create function public.cohort15_lofi_refund_credit_hold(
  p_transaction_id uuid, p_user_id uuid, p_hold_transaction_id uuid,
  p_idempotency_key text, p_cohort_id uuid, p_now timestamptz
)
returns table (transaction_id uuid, created boolean, available bigint, held bigint)
language sql
security definer
set search_path = ''
as $$
  select * from public.cohort15_lofi_settle_credit_hold(
    p_transaction_id, p_user_id, p_hold_transaction_id, 'refund', p_idempotency_key, p_cohort_id, p_now
  );
$$;

create function public.cohort15_lofi_fulfill_purchase(
  p_transaction_id uuid,
  p_purchase_id uuid,
  p_user_id uuid,
  p_package_id text,
  p_credits integer,
  p_amount_cents integer,
  p_currency text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_now timestamptz
)
returns table (purchase_id uuid, credit_transaction_id uuid, fulfilled boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_purchase public.cohort15_lofi_purchases%rowtype;
  v_transaction public.cohort15_lofi_credit_transactions%rowtype;
begin
  select purchases.* into v_purchase
  from public.cohort15_lofi_purchases as purchases
  where purchases.id = p_purchase_id
  for update;
  if v_purchase.id is null then raise exception 'not_found' using errcode = 'P0002'; end if;

  perform 1 from public.cohort15_lofi_users as users where users.id = v_purchase.user_id for update;
  if v_purchase.user_id <> p_user_id
    or v_purchase.package_id <> p_package_id
    or v_purchase.credits <> p_credits
    or v_purchase.amount_cents <> p_amount_cents
    or v_purchase.currency <> lower(btrim(p_currency))
    or v_purchase.stripe_checkout_session_id is null
    or v_purchase.stripe_checkout_session_id <> p_checkout_session_id then
    raise exception 'purchase_mismatch' using errcode = '23514';
  end if;

  if v_purchase.status = 'fulfilled' then
    select transactions.* into v_transaction
    from public.cohort15_lofi_credit_transactions as transactions
    where transactions.id = v_purchase.credit_transaction_id;
    if v_transaction.id is null or v_transaction.user_id <> p_user_id
      or v_transaction.type <> 'purchase' or v_transaction.amount <> p_credits then
      raise exception 'purchase_mismatch' using errcode = '23514';
    end if;
    return query select v_purchase.id, v_transaction.id, false;
    return;
  end if;
  if v_purchase.status <> 'pending' then raise exception 'purchase_mismatch' using errcode = '23514'; end if;

  insert into public.cohort15_lofi_credit_transactions (
    id, user_id, type, amount, idempotency_key, purchase_id, source, created_at
  ) values (
    p_transaction_id, p_user_id, 'purchase', p_credits, 'purchase:' || p_purchase_id::text,
    p_purchase_id, 'stripe', p_now
  ) returning * into v_transaction;

  update public.cohort15_lofi_purchases as purchases
  set status = 'fulfilled', stripe_payment_intent_id = p_payment_intent_id,
      credit_transaction_id = v_transaction.id, fulfilled_at = p_now, updated_at = p_now
  where purchases.id = p_purchase_id
  returning purchases.* into v_purchase;

  return query select v_purchase.id, v_transaction.id, true;
end;
$$;

revoke all on function public.cohort15_lofi_reject_credit_transaction_mutation() from public, anon, authenticated;
revoke all on function public.cohort15_lofi_credit_balance(uuid) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_provision_user(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_hold_credits(uuid, uuid, integer, text, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_settle_credit_hold(uuid, uuid, uuid, text, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_consume_credit_hold(uuid, uuid, uuid, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_refund_credit_hold(uuid, uuid, uuid, text, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.cohort15_lofi_fulfill_purchase(uuid, uuid, uuid, text, integer, integer, text, text, text, timestamptz) from public, anon, authenticated;

grant execute on function public.cohort15_lofi_credit_balance(uuid) to service_role;
grant execute on function public.cohort15_lofi_provision_user(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.cohort15_lofi_hold_credits(uuid, uuid, integer, text, uuid, text, timestamptz) to service_role;
grant execute on function public.cohort15_lofi_consume_credit_hold(uuid, uuid, uuid, text, uuid, timestamptz) to service_role;
grant execute on function public.cohort15_lofi_refund_credit_hold(uuid, uuid, uuid, text, uuid, timestamptz) to service_role;
grant execute on function public.cohort15_lofi_fulfill_purchase(uuid, uuid, uuid, text, integer, integer, text, text, text, timestamptz) to service_role;
