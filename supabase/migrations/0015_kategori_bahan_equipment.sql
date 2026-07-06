-- 0015: Review lanjutan (2026-07-06) — kategori bahan + modul Equipment.
--
-- 1) ingredients.category: Bahan Mentah / Bumbu Kering / Bumbu Basah /
--    Bahan Setengah Jadi (app-level options; no DB check for flexibility).
-- 2) equipment table: Equipment / Tools / Consumable / Kelengkapan —
--    stocked & purchasable like ingredients, valued as assets.
-- 3) purchase_items.equipment_id so a purchase line can target equipment.
-- 4) stock_movements.item_type check widened to include 'equipment'.
-- Everything applied to BOTH public and demo schemas; demo.reset_demo()
-- recreated to include equipment as copied master data.

-- ---------------------------------------------------------------
-- 1) Kategori bahan
-- ---------------------------------------------------------------
alter table public.ingredients add column if not exists category text;
alter table demo.ingredients   add column if not exists category text;

comment on column public.ingredients.category is
  'Kategori bahan: Bahan Mentah | Bumbu Kering | Bumbu Basah | Bahan Setengah Jadi';

-- ---------------------------------------------------------------
-- 2) Equipment (aset dapur & kelengkapan kirim)
-- ---------------------------------------------------------------
create table if not exists public.equipment (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null default 'Equipment',
  unit           text not null default 'pcs',
  stock_qty      numeric(14,3) not null default 0,
  min_stock      numeric(14,3) not null default 0,
  last_unit_cost numeric(14,2) not null default 0,
  avg_unit_cost  numeric(14,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.equipment is
  'SAVO Ops - equipment, tools, consumable, kelengkapan (packing dsb). Nilai aset = stok x modal rata-rata.';

drop trigger if exists trg_equipment_updated_at on public.equipment;
create trigger trg_equipment_updated_at
  before update on public.equipment
  for each row execute function public.set_updated_at();

alter table public.equipment enable row level security;
drop policy if exists "equipment_all_authenticated" on public.equipment;
create policy "equipment_all_authenticated"
  on public.equipment for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.equipment to authenticated, service_role;

-- demo clone
create table if not exists demo.equipment (like public.equipment including all);
drop trigger if exists trg_demo_updated_at on demo.equipment;
create trigger trg_demo_updated_at before update on demo.equipment
  for each row execute function public.set_updated_at();
alter table demo.equipment enable row level security;
drop policy if exists demo_all_authenticated on demo.equipment;
create policy demo_all_authenticated on demo.equipment
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on demo.equipment to authenticated, service_role;

-- ---------------------------------------------------------------
-- 3) Pembelian bisa menyasar equipment
-- ---------------------------------------------------------------
alter table public.purchase_items
  add column if not exists equipment_id uuid references public.equipment (id) on delete set null;
alter table demo.purchase_items
  add column if not exists equipment_id uuid references demo.equipment (id) on delete set null;

-- ---------------------------------------------------------------
-- 4) stock_movements.item_type += 'equipment' (kedua skema)
-- ---------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select n.nspname as sch, c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where t.relname = 'stock_movements'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%item_type%'
  loop
    execute format('alter table %I.stock_movements drop constraint %I', r.sch, r.conname);
  end loop;
  alter table public.stock_movements
    add constraint stock_movements_item_type_check
    check (item_type in ('product','ingredient','equipment'));
  alter table demo.stock_movements
    add constraint stock_movements_item_type_check
    check (item_type in ('product','ingredient','equipment'));
end $$;

-- ---------------------------------------------------------------
-- 5) reset_demo: equipment ikut jadi master data latihan
-- ---------------------------------------------------------------
create or replace function demo.reset_demo()
returns void
language plpgsql
security definer
set search_path = demo, public
as $$
begin
  truncate
    demo.stock_movements, demo.payments, demo.invoices, demo.order_items,
    demo.orders, demo.purchase_items, demo.purchases, demo.production_batches,
    demo.expenses, demo.recipe_items, demo.recipes, demo.customers,
    demo.products, demo.ingredients, demo.equipment, demo.business_settings
    cascade;

  insert into demo.business_settings select * from public.business_settings;
  insert into demo.products          select * from public.products;
  insert into demo.ingredients       select * from public.ingredients;
  insert into demo.equipment         select * from public.equipment;
  insert into demo.recipes           select * from public.recipes;
  insert into demo.recipe_items      select * from public.recipe_items;
  insert into demo.customers         select * from public.customers;

  delete from public.seq_counters where name like 'demo-%';
end;
$$;

grant execute on function demo.reset_demo() to authenticated, service_role;

notify pgrst, 'reload schema';
