-- =============================================================
-- SAVO Ops — Migration 0009 (Phase 2: Pembelian & Produksi)
-- purchases + purchase_items, production_batches.
-- Stock effects are applied by the app and logged in stock_movements.
-- =============================================================

-- ---------------- purchases ----------------
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  purchase_no   text unique,
  supplier_name text,
  purchase_date date not null default (now() at time zone 'Asia/Jakarta')::date,
  total         numeric(14,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create table if not exists public.purchase_items (
  id            uuid primary key default gen_random_uuid(),
  purchase_id   uuid not null references public.purchases (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete set null,
  name          text,
  qty           numeric(14,3) not null default 0,
  unit_cost     numeric(14,2) not null default 0,
  subtotal      numeric(14,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_purchase_items_purchase on public.purchase_items (purchase_id);

drop trigger if exists trg_purchase_items_updated_at on public.purchase_items;
create trigger trg_purchase_items_updated_at
  before update on public.purchase_items
  for each row execute function public.set_updated_at();

-- ---------------- production_batches ----------------
create table if not exists public.production_batches (
  id            uuid primary key default gen_random_uuid(),
  batch_no      text unique,
  product_id    uuid references public.products (id) on delete set null,
  recipe_id     uuid references public.recipes (id) on delete set null,
  batch_count   numeric(14,3) not null default 1,
  produced_qty  numeric(14,3) not null default 0,
  hpp_total     numeric(14,2) not null default 0,
  hpp_per_unit  numeric(14,2) not null default 0,
  produced_at   date not null default (now() at time zone 'Asia/Jakarta')::date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_production_product on public.production_batches (product_id);

drop trigger if exists trg_production_updated_at on public.production_batches;
create trigger trg_production_updated_at
  before update on public.production_batches
  for each row execute function public.set_updated_at();

-- ---------------- RLS + grants ----------------
alter table public.purchases          enable row level security;
alter table public.purchase_items     enable row level security;
alter table public.production_batches enable row level security;

drop policy if exists "purchases_all_authenticated" on public.purchases;
create policy "purchases_all_authenticated"
  on public.purchases for all to authenticated using (true) with check (true);

drop policy if exists "purchase_items_all_authenticated" on public.purchase_items;
create policy "purchase_items_all_authenticated"
  on public.purchase_items for all to authenticated using (true) with check (true);

drop policy if exists "production_batches_all_authenticated" on public.production_batches;
create policy "production_batches_all_authenticated"
  on public.production_batches for all to authenticated using (true) with check (true);

grant select, insert, update, delete
  on public.purchases, public.purchase_items, public.production_batches
  to authenticated, service_role;

comment on table public.purchases          is 'SAVO Ops - pembelian bahan';
comment on table public.purchase_items     is 'SAVO Ops - item pembelian';
comment on table public.production_batches is 'SAVO Ops - batch produksi';

notify pgrst, 'reload schema';
