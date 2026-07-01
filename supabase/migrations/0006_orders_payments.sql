-- =============================================================
-- SAVO Ops — Migration 0006 (Phase 1: Pesanan & Pembayaran)
-- orders, order_items, payments, atomic sequence counters.
-- =============================================================

-- -------------------------------------------------------------
-- Atomic per-name counter (for SO-YYYY-#### and INV-YYYY-####)
-- -------------------------------------------------------------
create table if not exists public.seq_counters (
  name  text primary key,
  value integer not null default 0
);

create or replace function public.next_seq(p_name text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v integer;
begin
  insert into public.seq_counters (name, value) values (p_name, 1)
    on conflict (name) do update set value = public.seq_counters.value + 1
    returning value into v;
  return v;
end;
$$;

-- -------------------------------------------------------------
-- orders
-- -------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  order_no       text unique,
  customer_id    uuid references public.customers (id) on delete set null,
  channel        text not null default 'wa' check (channel in ('wa','ig','b2b','other')),
  order_date     date not null default (now() at time zone 'Asia/Jakarta')::date,
  status         text not null default 'draft'
                   check (status in ('draft','confirmed','in_production','ready','delivered','completed','cancelled')),
  subtotal       numeric(14,2) not null default 0,
  discount       numeric(14,2) not null default 0,
  shipping       numeric(14,2) not null default 0,
  tax            numeric(14,2) not null default 0,
  total          numeric(14,2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid')),
  stock_applied  boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_date on public.orders (order_date desc);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- order_items
-- -------------------------------------------------------------
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  name        text,
  qty         numeric(14,3) not null default 1,
  unit_price  numeric(14,2) not null default 0,
  subtotal    numeric(14,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_order_items_order on public.order_items (order_id);

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at
  before update on public.order_items
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- payments (manual now, gateway-ready schema)
-- -------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  amount           numeric(14,2) not null default 0,
  method           text not null default 'transfer' check (method in ('cash','transfer','qris','other')),
  status           text not null default 'settled' check (status in ('pending','settled','failed')),
  paid_at          timestamptz not null default now(),
  reference        text,
  provider         text,
  provider_order_id text,
  provider_txn_id  text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments (order_id);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- =============================================================
-- RLS + grants
-- =============================================================
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.payments    enable row level security;

drop policy if exists "orders_all_authenticated" on public.orders;
create policy "orders_all_authenticated"
  on public.orders for all to authenticated using (true) with check (true);

drop policy if exists "order_items_all_authenticated" on public.order_items;
create policy "order_items_all_authenticated"
  on public.order_items for all to authenticated using (true) with check (true);

drop policy if exists "payments_all_authenticated" on public.payments;
create policy "payments_all_authenticated"
  on public.payments for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.orders, public.order_items, public.payments
  to authenticated, service_role;
grant select, insert, update, delete on public.seq_counters to authenticated, service_role;
grant execute on function public.next_seq(text) to authenticated, service_role;

comment on table public.orders      is 'SAVO Ops - pesanan';
comment on table public.order_items is 'SAVO Ops - item pesanan';
comment on table public.payments    is 'SAVO Ops - pembayaran';

notify pgrst, 'reload schema';
