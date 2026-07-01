-- =============================================================
-- SAVO Ops — Migration 0005 (Phase 1: Pelanggan)
-- customers + trigger, RLS, grants.
-- =============================================================

create table if not exists public.customers (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  type               text not null default 'b2c' check (type in ('b2c','b2b')),
  business_name      text,
  phone_wa           text,
  email              text,
  address            text,
  price_tier         text not null default 'b2c' check (price_tier in ('b2c','b2b')),
  payment_terms_days integer not null default 0,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_customers_name on public.customers (name);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

drop policy if exists "customers_all_authenticated" on public.customers;
create policy "customers_all_authenticated"
  on public.customers for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.customers to authenticated, service_role;

comment on table public.customers is 'SAVO Ops - pelanggan';

notify pgrst, 'reload schema';
