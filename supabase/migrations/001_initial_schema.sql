create extension if not exists "pgcrypto";

create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  github_handle text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.capability_scores (
  user_id uuid not null references public.users(user_id) on delete cascade,
  layer_id text not null,
  p_mastery double precision not null default 0.2
    check (p_mastery >= 0 and p_mastery <= 1),
  p_transit double precision not null default 0.1
    check (p_transit >= 0 and p_transit <= 1),
  p_slip double precision not null default 0.1
    check (p_slip >= 0 and p_slip <= 1),
  p_guess double precision not null default 0.2
    check (p_guess >= 0 and p_guess <= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, layer_id)
);

create table if not exists public.intervention_logs (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  requested_level integer not null check (requested_level >= 0),
  permitted_level integer not null check (permitted_level >= 0),
  abstraction_layer text not null,
  checkpoint_triggered boolean not null default false,
  checkpoint_passed boolean,
  "timestamp" timestamptz not null default now()
);

create index if not exists capability_scores_user_layer_idx
  on public.capability_scores (user_id, layer_id);

create index if not exists intervention_logs_user_timestamp_idx
  on public.intervention_logs (user_id, "timestamp" desc);
