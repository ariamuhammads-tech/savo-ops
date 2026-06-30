-- =============================================================
-- SAVO Ops — Migration 0001 (Phase 0 baseline)
-- Profiles, business_settings, updated_at trigger,
-- RLS + Data API grants, auto-create profile on signup.
-- All UI text is Indonesian; this file is infrastructure only.
-- =============================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- Shared: updated_at auto-touch trigger function
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------
-- profiles — mirrors auth.users (one row per app user)
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- business_settings — singleton row used on invoices
-- -------------------------------------------------------------
create table if not exists public.business_settings (
  id                uuid primary key default gen_random_uuid(),
  business_name     text not null default 'SAVO',
  tagline           text,
  address           text,
  phone_wa          text,
  email             text,
  instagram         text,
  npwp              text,
  logo_url          text,
  invoice_prefix    text not null default 'INV',
  tax_percent       numeric(6,2) not null default 0,
  bank_name         text,
  bank_account_no   text,
  bank_account_name text,
  invoice_notes     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_business_settings_updated_at on public.business_settings;
create trigger trg_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- Auto-create a profile when a new auth user is created
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security
-- Policy: any authenticated user (a real app user) has full access.
-- Unauthenticated (anon) gets nothing.
-- =============================================================
alter table public.profiles          enable row level security;
alter table public.business_settings enable row level security;

-- profiles: authenticated users can read all profiles and manage their own
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_modify_self" on public.profiles;
create policy "profiles_modify_self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- business_settings: full access for any authenticated user
drop policy if exists "business_settings_all_authenticated" on public.business_settings;
create policy "business_settings_all_authenticated"
  on public.business_settings for all
  to authenticated
  using (true)
  with check (true);

-- =============================================================
-- Data API grants (required for Supabase projects after 2026-05-30)
-- Grant table/sequence access to the authenticated role only.
-- anon gets schema usage but no table privileges.
-- =============================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Apply same grants to future tables/sequences created in this schema
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
