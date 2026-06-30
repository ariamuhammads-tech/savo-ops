-- =============================================================
-- SAVO Ops — Migration 0003 (Phase 1: Produk, Bahan Baku, buku stok)
-- products, ingredients, stock_movements + triggers, RLS, grants.
-- Money: numeric(14,2) IDR. Quantities: numeric(14,3).
-- =============================================================

-- -------------------------------------------------------------
-- ingredients — raw materials
-- -------------------------------------------------------------
create table if not exists public.ingredients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  unit           text not null default 'g',
  stock_qty      numeric(14,3) not null default 0,
  min_stock      numeric(14,3) not null default 0,
  last_unit_cost numeric(14,2) not null default 0,
  supplier_name  text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_ingredients_updated_at on public.ingredients;
create trigger trg_ingredients_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- products — finished goods / SKU
-- -------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  name          text not null,
  category      text,
  unit          text not null default 'pack',
  weight_grams  numeric(14,3),
  price_b2c     numeric(14,2) not null default 0,
  price_b2b     numeric(14,2) not null default 0,
  photo_url     text,
  stock_qty     numeric(14,3) not null default 0,
  min_stock     numeric(14,3) not null default 0,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------
-- stock_movements — unified inventory ledger
-- -------------------------------------------------------------
create table if not exists public.stock_movements (
  id            uuid primary key default gen_random_uuid(),
  item_type     text not null check (item_type in ('product','ingredient')),
  item_id       uuid not null,
  movement_type text not null check (movement_type in
                  ('adjustment','sale','production_in','production_out','purchase','waste')),
  qty_change    numeric(14,3) not null,
  balance_after numeric(14,3),
  ref_type      text,
  ref_id        uuid,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_stock_movements_item
  on public.stock_movements (item_type, item_id, created_at desc);

drop trigger if exists trg_stock_movements_updated_at on public.stock_movements;
create trigger trg_stock_movements_updated_at
  before update on public.stock_movements
  for each row execute function public.set_updated_at();

-- =============================================================
-- RLS — authenticated users have full access; anon none.
-- =============================================================
alter table public.ingredients     enable row level security;
alter table public.products        enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "ingredients_all_authenticated" on public.ingredients;
create policy "ingredients_all_authenticated"
  on public.ingredients for all to authenticated using (true) with check (true);

drop policy if exists "products_all_authenticated" on public.products;
create policy "products_all_authenticated"
  on public.products for all to authenticated using (true) with check (true);

drop policy if exists "stock_movements_all_authenticated" on public.stock_movements;
create policy "stock_movements_all_authenticated"
  on public.stock_movements for all to authenticated using (true) with check (true);

-- =============================================================
-- Grants (Data API) + force PostgREST schema reload.
-- =============================================================
grant select, insert, update, delete on public.ingredients, public.products, public.stock_movements
  to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

comment on table public.ingredients     is 'SAVO Ops - bahan baku';
comment on table public.products        is 'SAVO Ops - produk jadi';
comment on table public.stock_movements is 'SAVO Ops - buku stok';

notify pgrst, 'reload schema';
