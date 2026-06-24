create table if not exists public.cohort15_lofi_feedback (
  id uuid primary key,
  session_id text not null unique,
  path text not null,
  action_context jsonb not null default '{}'::jsonb,
  looking_for_group text check (looking_for_group in ('yes', 'no', 'not_sure')),
  looking_for_instead text,
  group_intent text check (group_intent in ('create', 'join', 'both')),
  did_create_or_join text check (did_create_or_join in ('created', 'joined', 'both', 'not_yet', 'tried_but_stopped')),
  why_or_why_not text,
  contact_email text,
  contact_x text,
  contact_linkedin text,
  contact_other text,
  completion_state text not null default 'partial' check (completion_state in ('partial', 'completed')),
  last_step integer not null default 0 check (last_step >= 0 and last_step <= 6),
  submitted_on_close boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz
);

alter table public.cohort15_lofi_feedback enable row level security;

revoke all on table public.cohort15_lofi_feedback from public;
revoke all on table public.cohort15_lofi_feedback from anon;
revoke all on table public.cohort15_lofi_feedback from authenticated;
grant select, insert, update on table public.cohort15_lofi_feedback to service_role;

create index if not exists cohort15_lofi_feedback_created_at_idx
  on public.cohort15_lofi_feedback (created_at desc);

create index if not exists cohort15_lofi_feedback_completion_state_idx
  on public.cohort15_lofi_feedback (completion_state);
