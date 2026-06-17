create table if not exists public.cohort15_users (
  id text primary key,
  display_name text not null,
  email text,
  auth_provider text,
  auth_subject text,
  created_at timestamptz not null
);

create unique index if not exists cohort15_users_auth_identity_idx
  on public.cohort15_users(auth_provider, auth_subject)
  where auth_provider is not null and auth_subject is not null;

create table if not exists public.cohort15_events (
  id text primary key,
  creator_id text not null references public.cohort15_users(id),
  title text not null,
  description text not null,
  category text not null,
  topic text not null,
  target_audience text not null,
  target_skill_level text not null,
  additional_details text,
  min_quorum integer not null check (min_quorum > 0),
  max_participants integer not null check (max_participants >= min_quorum),
  status text not null,
  locked_event_link text not null,
  image_url text not null,
  first_meeting_at timestamptz not null,
  meeting_duration_minutes integer not null check (meeting_duration_minutes > 0),
  recurrence text not null,
  meeting_count integer not null check (meeting_count > 0),
  expires_at timestamptz not null,
  social_post_status text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.cohort15_event_interests (
  id text primary key,
  event_id text not null references public.cohort15_events(id),
  user_id text not null references public.cohort15_users(id),
  credits_held integer not null check (credits_held > 0),
  status text not null,
  created_at timestamptz not null,
  unique (event_id, user_id)
);

create table if not exists public.cohort15_credit_transactions (
  id text primary key,
  user_id text not null references public.cohort15_users(id),
  event_id text references public.cohort15_events(id),
  amount integer not null check (amount > 0),
  type text not null,
  source text,
  created_at timestamptz not null
);

create index if not exists cohort15_credit_transactions_user_id_idx
  on public.cohort15_credit_transactions(user_id);

create index if not exists cohort15_credit_transactions_event_id_idx
  on public.cohort15_credit_transactions(event_id);

create index if not exists cohort15_credit_transactions_type_idx
  on public.cohort15_credit_transactions(type);

create table if not exists public.cohort15_social_posts (
  id text primary key,
  event_id text not null references public.cohort15_events(id),
  platform text not null,
  post_text text not null,
  post_url text,
  status text not null,
  created_at timestamptz not null,
  posted_at timestamptz
);

create index if not exists cohort15_social_posts_event_id_idx
  on public.cohort15_social_posts(event_id);

create index if not exists cohort15_social_posts_platform_status_idx
  on public.cohort15_social_posts(platform, status);

create table if not exists public.cohort15_purchases (
  id text primary key,
  user_id text not null references public.cohort15_users(id),
  provider text not null,
  provider_checkout_id text unique,
  provider_payment_id text unique,
  package_credits integer not null check (package_credits > 0),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  status text not null,
  credit_transaction_id text references public.cohort15_credit_transactions(id),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.cohort15_users enable row level security;
alter table public.cohort15_events enable row level security;
alter table public.cohort15_event_interests enable row level security;
alter table public.cohort15_credit_transactions enable row level security;
alter table public.cohort15_social_posts enable row level security;
alter table public.cohort15_purchases enable row level security;

create or replace function public.cohort15_available_credits(p_user_id text)
returns integer
language sql
stable
as $$
  with totals as (
    select
      coalesce(sum(amount) filter (where type in ('grant', 'purchase')), 0) as funded,
      coalesce(sum(amount) filter (where type = 'hold'), 0) as held_total,
      coalesce(sum(amount) filter (where type = 'consume'), 0) as consumed,
      coalesce(sum(amount) filter (where type = 'refund'), 0) as refunded
    from public.cohort15_credit_transactions
    where user_id = p_user_id
  )
  select funded - consumed - (held_total - consumed - refunded)
  from totals;
$$;

create or replace function public.cohort15_held_credits(p_user_id text, p_event_id text)
returns integer
language sql
stable
as $$
  with totals as (
    select
      coalesce(sum(amount) filter (where type = 'hold'), 0) as held_total,
      coalesce(sum(amount) filter (where type = 'consume'), 0) as consumed,
      coalesce(sum(amount) filter (where type = 'refund'), 0) as refunded
    from public.cohort15_credit_transactions
    where user_id = p_user_id
      and event_id = p_event_id
  )
  select held_total - consumed - refunded
  from totals;
$$;

create or replace function public.cohort15_append_credit_transaction(
  p_id text,
  p_user_id text,
  p_event_id text,
  p_amount integer,
  p_type text,
  p_source text,
  p_created_at timestamptz
)
returns public.cohort15_credit_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.cohort15_credit_transactions;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id));

  if p_amount <= 0 then
    raise exception 'Credit amount must be greater than 0.';
  end if;

  if p_type = 'hold' and public.cohort15_available_credits(p_user_id) < p_amount then
    raise exception 'Insufficient available credits for %.', p_user_id;
  end if;

  if p_type in ('consume', 'refund')
    and public.cohort15_held_credits(p_user_id, p_event_id) < p_amount then
    raise exception 'Insufficient held credits for % on %.', p_user_id, p_event_id;
  end if;

  insert into public.cohort15_credit_transactions (
    id,
    user_id,
    event_id,
    amount,
    type,
    source,
    created_at
  ) values (
    p_id,
    p_user_id,
    p_event_id,
    p_amount,
    p_type,
    p_source,
    p_created_at
  )
  returning * into inserted;

  return inserted;
end;
$$;
